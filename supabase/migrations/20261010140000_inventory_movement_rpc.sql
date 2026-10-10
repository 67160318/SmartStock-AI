begin;

alter table public.inventory_movements
  add column idempotency_signature text;

-- Remove table-level and existing column-level writes that can bypass the ledger.
revoke insert, update on table public.ingredients from authenticated;
revoke insert (
  id, restaurant_id, supplier_id, name, category, unit, current_stock,
  reorder_level, notes, created_at, updated_at
), update (
  id, restaurant_id, supplier_id, name, category, unit, current_stock,
  reorder_level, notes, created_at, updated_at
) on table public.ingredients from authenticated;

-- Keep ingredient creation and editing available for metadata only.
grant insert (
  restaurant_id, supplier_id, name, category, unit, reorder_level, notes
) on table public.ingredients to authenticated;
grant update (
  supplier_id, name, category, unit, reorder_level, notes
) on table public.ingredients to authenticated;

-- Distinguish ordinary ingredient use from discarded or spoiled stock.
alter table public.inventory_movements
  drop constraint inventory_movements_movement_type_check;
alter table public.inventory_movements
  add constraint inventory_movements_movement_type_check
  check (movement_type in ('initial', 'purchase', 'sale', 'adjustment', 'waste', 'return', 'correction', 'consumption'));

-- Keep the ledger's nonzero-delta rule except for explicitly marked stock no-ops.
alter table public.inventory_movements
  drop constraint inventory_movements_quantity_delta_check;
alter table public.inventory_movements
  add constraint inventory_movements_quantity_delta_check
  check (
    quantity_delta <> 0
    or (movement_type = 'adjustment' and reference_type = 'inventory_manager_noop')
  );

-- Keep the ledger readable under its existing SELECT policy, but make it append-only
-- for clients. The SECURITY DEFINER RPC below is the only authenticated write path.
revoke insert, update, delete on table public.inventory_movements from authenticated;
revoke insert (
  id, restaurant_id, ingredient_id, movement_type, quantity_delta,
  reference_type, reference_id, idempotency_key, idempotency_signature,
  note, created_by, created_at
), update (
  id, restaurant_id, ingredient_id, movement_type, quantity_delta,
  reference_type, reference_id, idempotency_key, idempotency_signature,
  note, created_by, created_at
) on table public.inventory_movements from authenticated;
grant select on table public.inventory_movements to authenticated;

-- Preserve movement history when an ingredient is deleted. Existing ingredient
-- delete policies remain unchanged; the FK now rejects deletion when history exists.
alter table public.inventory_movements
  drop constraint inventory_movements_ingredient_same_restaurant_fk;
alter table public.inventory_movements
  add constraint inventory_movements_ingredient_same_restaurant_fk
  foreign key (restaurant_id, ingredient_id)
  references public.ingredients (restaurant_id, id)
  on delete restrict;

create function public.record_inventory_movement(
  p_restaurant_id uuid,
  p_ingredient_id uuid,
  p_operation text,
  p_quantity numeric,
  p_reason text,
  p_idempotency_key text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid;
  v_operation text;
  v_movement_type text;
  v_delta numeric;
  v_current_stock numeric;
  v_new_stock numeric;
  v_reason text;
  v_idempotency_key text;
  v_request_signature text;
  v_existing_id uuid;
  v_existing_ingredient_id uuid;
  v_existing_type text;
  v_existing_signature text;
  v_existing_note text;
  v_existing_user_id uuid;
  v_max_stock constant numeric := 9999999999.9999;
begin
  v_user_id := (select auth.uid());
  if v_user_id is null then
    raise exception 'Authentication is required' using errcode = '42501';
  end if;

  if p_restaurant_id is null or not exists (
    select 1
      from public.restaurant_members as membership
     where membership.restaurant_id = p_restaurant_id
       and membership.user_id = v_user_id
  ) then
    raise exception 'Restaurant membership is required' using errcode = '42501';
  end if;

  if p_ingredient_id is null then
    raise exception 'An ingredient is required' using errcode = '22023';
  end if;

  v_operation := pg_catalog.lower(pg_catalog.btrim(coalesce(p_operation, '')));
  v_reason := pg_catalog.btrim(coalesce(p_reason, ''));
  v_idempotency_key := pg_catalog.btrim(coalesce(p_idempotency_key, ''));

  if pg_catalog.char_length(v_reason) not between 1 and 500 then
    raise exception 'Reason must contain between 1 and 500 characters'
      using errcode = '22023';
  end if;

  if pg_catalog.char_length(v_idempotency_key) not between 1 and 200 then
    raise exception 'A 1-200 character idempotency key is required'
      using errcode = '22023';
  end if;

  if p_quantity is null
     or p_quantity::text in ('NaN', 'Infinity', '-Infinity')
     or p_quantity <> pg_catalog.trunc(p_quantity, 4)
     or pg_catalog.abs(p_quantity) > v_max_stock then
    raise exception 'Quantity must be finite and within the supported 4-decimal range'
      using errcode = '22023';
  end if;

  if v_operation = 'set_stock' then
    if p_quantity < 0 then
      raise exception 'Target stock cannot be negative' using errcode = '22023';
    end if;
    v_movement_type := 'adjustment';
  elsif v_operation = 'receive' then
    if p_quantity <= 0 then
      raise exception 'Received quantity must be positive' using errcode = '22023';
    end if;
    v_movement_type := 'purchase';
    v_delta := p_quantity;
  elsif v_operation = 'withdraw' then
    if p_quantity <= 0 then
      raise exception 'Withdrawn quantity must be positive' using errcode = '22023';
    end if;
    v_movement_type := 'consumption';
    v_delta := -p_quantity;
  elsif v_operation = 'waste' then
    if p_quantity <= 0 then
      raise exception 'Wasted quantity must be positive' using errcode = '22023';
    end if;
    v_movement_type := 'waste';
    v_delta := -p_quantity;
  elsif v_operation = 'adjust' then
    if p_quantity = 0 then
      raise exception 'Adjustment quantity cannot be zero' using errcode = '22023';
    end if;
    v_movement_type := 'adjustment';
    v_delta := p_quantity;
  else
    raise exception 'Operation must be set_stock, receive, withdraw, waste, or adjust'
      using errcode = '22023';
  end if;

  v_request_signature := 'inventory_manager:v1:' || v_operation || ':' ||
    pg_catalog.trim_scale(p_quantity)::text;

  -- Serialize retries sharing a restaurant/key. Hash collisions only serialize
  -- unrelated requests; the existing unique partial index remains authoritative.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      p_restaurant_id::text || ':' || v_idempotency_key,
      0
    )
  );

  select movement.id,
         movement.ingredient_id,
         movement.movement_type,
         movement.idempotency_signature,
         movement.note,
         movement.created_by
    into v_existing_id,
         v_existing_ingredient_id,
         v_existing_type,
         v_existing_signature,
         v_existing_note,
         v_existing_user_id
    from public.inventory_movements as movement
   where movement.restaurant_id = p_restaurant_id
     and movement.idempotency_key = v_idempotency_key;

  if found then
    if v_existing_ingredient_id is distinct from p_ingredient_id
       or v_existing_type is distinct from v_movement_type
       or v_existing_signature is distinct from v_request_signature
       or v_existing_note is distinct from v_reason
       or v_existing_user_id is distinct from v_user_id then
      raise exception 'Idempotency key was already used for a different movement'
        using errcode = '23505';
    end if;
    return v_existing_id;
  end if;

  -- Serialize balance changes for this tenant-scoped ingredient.
  select ingredient.current_stock
    into v_current_stock
    from public.ingredients as ingredient
   where ingredient.id = p_ingredient_id
     and ingredient.restaurant_id = p_restaurant_id
   for update;

  if not found then
    raise exception 'Ingredient not found in this restaurant' using errcode = 'P0002';
  end if;

  if v_operation = 'set_stock' then
    v_delta := p_quantity - v_current_stock;
  end if;

  v_new_stock := v_current_stock + v_delta;
  if v_new_stock < 0 then
    raise exception 'Movement would result in negative stock' using errcode = '23514';
  end if;
  if v_new_stock > v_max_stock then
    raise exception 'Movement exceeds the supported stock range' using errcode = '22003';
  end if;

  if v_delta <> 0 then
    update public.ingredients as ingredient
       set current_stock = v_new_stock
     where ingredient.id = p_ingredient_id
       and ingredient.restaurant_id = p_restaurant_id;
  end if;

  insert into public.inventory_movements (
    restaurant_id,
    ingredient_id,
    movement_type,
    quantity_delta,
    reference_type,
    idempotency_key,
    idempotency_signature,
    note,
    created_by
  ) values (
    p_restaurant_id,
    p_ingredient_id,
    v_movement_type,
    v_delta,
    case when v_delta = 0 then 'inventory_manager_noop' else 'inventory_manager' end,
    v_idempotency_key,
    v_request_signature,
    v_reason,
    v_user_id
  ) returning id into v_existing_id;

  return v_existing_id;
end;
$function$;

-- Supabase's trusted postgres owner supplies the table privileges for this
-- SECURITY DEFINER function. The body performs its own caller/tenant checks.
alter function public.record_inventory_movement(uuid, uuid, text, numeric, text, text)
  owner to postgres;

revoke all on function public.record_inventory_movement(uuid, uuid, text, numeric, text, text)
  from public, anon, authenticated;
grant execute on function public.record_inventory_movement(uuid, uuid, text, numeric, text, text)
  to authenticated;

comment on function public.record_inventory_movement(uuid, uuid, text, numeric, text, text)
  is 'Atomically applies a tenant-authorized, idempotent stock movement and appends its ledger entry.';

commit;
