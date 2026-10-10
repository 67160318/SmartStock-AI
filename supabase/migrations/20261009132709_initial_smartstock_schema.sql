-- SmartStock AI initial tenant-isolated schema.
-- Apply with `supabase db push` or paste this entire file into the Supabase SQL Editor.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  restaurant_type text,
  location text,
  currency text not null default 'THB' check (currency ~ '^[A-Z]{3}$'),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id)
);

create table public.restaurant_members (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'manager', 'member', 'viewer')),
  joined_at timestamptz not null default now(),
  unique (restaurant_id, user_id),
  unique (restaurant_id, id)
);

create index restaurant_members_user_restaurant_idx on public.restaurant_members (user_id, restaurant_id);

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 160),
  contact_name text,
  contact_email text,
  phone text,
  lead_time_days integer not null default 0 check (lead_time_days >= 0),
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, id),
  unique (restaurant_id, name)
);

create index suppliers_restaurant_idx on public.suppliers (restaurant_id, name);

create table public.ingredients (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  supplier_id uuid,
  name text not null check (char_length(btrim(name)) between 1 and 160),
  category text,
  unit text not null,
  current_stock numeric(14, 4) not null default 0 check (current_stock >= 0),
  reorder_level numeric(14, 4) not null default 0 check (reorder_level >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, id),
  constraint ingredients_supplier_same_restaurant_fk
    foreign key (restaurant_id, supplier_id) references public.suppliers (restaurant_id, id) on delete set null (supplier_id)
);

create index ingredients_restaurant_idx on public.ingredients (restaurant_id, name);
create index ingredients_supplier_idx on public.ingredients (restaurant_id, supplier_id);

create table public.menu_products (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 160),
  category text,
  price numeric(14, 2) not null default 0 check (price >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, id)
);

create index menu_products_restaurant_idx on public.menu_products (restaurant_id, name);

create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  menu_product_id uuid not null,
  ingredient_id uuid not null,
  quantity numeric(14, 4) not null check (quantity > 0),
  unit text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, id),
  unique (restaurant_id, menu_product_id, ingredient_id),
  constraint recipes_product_same_restaurant_fk
    foreign key (restaurant_id, menu_product_id) references public.menu_products (restaurant_id, id) on delete cascade,
  constraint recipes_ingredient_same_restaurant_fk
    foreign key (restaurant_id, ingredient_id) references public.ingredients (restaurant_id, id) on delete cascade
);

create index recipes_restaurant_product_idx on public.recipes (restaurant_id, menu_product_id);
create index recipes_restaurant_ingredient_idx on public.recipes (restaurant_id, ingredient_id);

create table public.sales_imports (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  file_name text not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'imported', 'failed')),
  record_count integer not null default 0 check (record_count >= 0),
  error_message text,
  imported_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, id)
);

create index sales_imports_restaurant_created_idx on public.sales_imports (restaurant_id, created_at desc);

create table public.sales_records (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  sales_import_id uuid not null,
  menu_product_id uuid,
  transaction_id text,
  source_product_name text not null,
  import_row_number integer not null check (import_row_number > 0),
  quantity numeric(14, 4) not null check (quantity > 0),
  unit_price numeric(14, 4) not null check (unit_price >= 0),
  sold_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (restaurant_id, id),
  unique (restaurant_id, sales_import_id, import_row_number),
  constraint sales_records_import_same_restaurant_fk
    foreign key (restaurant_id, sales_import_id) references public.sales_imports (restaurant_id, id) on delete cascade,
  constraint sales_records_product_same_restaurant_fk
    foreign key (restaurant_id, menu_product_id) references public.menu_products (restaurant_id, id) on delete set null (menu_product_id)
);

create index sales_records_restaurant_sold_idx on public.sales_records (restaurant_id, sold_at desc);
create index sales_records_restaurant_product_idx on public.sales_records (restaurant_id, menu_product_id);

create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  ingredient_id uuid not null,
  movement_type text not null check (movement_type in ('initial', 'purchase', 'sale', 'adjustment', 'waste', 'return', 'correction')),
  quantity_delta numeric(14, 4) not null check (quantity_delta <> 0),
  reference_type text,
  reference_id uuid,
  idempotency_key text,
  note text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint inventory_movements_ingredient_same_restaurant_fk
    foreign key (restaurant_id, ingredient_id) references public.ingredients (restaurant_id, id) on delete cascade
);

create index inventory_movements_restaurant_created_idx on public.inventory_movements (restaurant_id, created_at desc);
create index inventory_movements_restaurant_ingredient_idx on public.inventory_movements (restaurant_id, ingredient_id, created_at desc);
create unique index inventory_movements_idempotency_idx
  on public.inventory_movements (restaurant_id, idempotency_key) where idempotency_key is not null;

create table public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  supplier_id uuid not null,
  order_number text not null,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'in_transit', 'received', 'cancelled')),
  placed_on date,
  expected_at timestamptz,
  received_at timestamptz,
  notes text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, id),
  unique (restaurant_id, order_number),
  constraint purchase_orders_supplier_same_restaurant_fk
    foreign key (restaurant_id, supplier_id) references public.suppliers (restaurant_id, id) on delete restrict
);

create index purchase_orders_restaurant_status_idx on public.purchase_orders (restaurant_id, status, created_at desc);
create index purchase_orders_restaurant_supplier_idx on public.purchase_orders (restaurant_id, supplier_id);

create table public.purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  purchase_order_id uuid not null,
  ingredient_id uuid not null,
  quantity numeric(14, 4) not null check (quantity > 0),
  received_quantity numeric(14, 4) not null default 0 check (received_quantity >= 0 and received_quantity <= quantity),
  unit_cost numeric(14, 4) not null default 0 check (unit_cost >= 0),
  unit text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, id),
  constraint purchase_order_items_order_same_restaurant_fk
    foreign key (restaurant_id, purchase_order_id) references public.purchase_orders (restaurant_id, id) on delete cascade,
  constraint purchase_order_items_ingredient_same_restaurant_fk
    foreign key (restaurant_id, ingredient_id) references public.ingredients (restaurant_id, id) on delete restrict
);

create index purchase_order_items_restaurant_order_idx on public.purchase_order_items (restaurant_id, purchase_order_id);
create index purchase_order_items_restaurant_ingredient_idx on public.purchase_order_items (restaurant_id, ingredient_id);

create table public.forecast_runs (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  window_start date not null,
  window_end date not null,
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  model_version text,
  generated_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (restaurant_id, id),
  check (window_end > window_start)
);

create index forecast_runs_restaurant_created_idx on public.forecast_runs (restaurant_id, created_at desc);

create table public.forecast_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  forecast_run_id uuid not null,
  ingredient_id uuid not null,
  predicted_quantity numeric(14, 4) not null check (predicted_quantity >= 0),
  suggested_quantity numeric(14, 4) not null check (suggested_quantity >= 0),
  confidence numeric(5, 4) check (confidence between 0 and 1),
  unit text not null,
  created_at timestamptz not null default now(),
  unique (restaurant_id, forecast_run_id, ingredient_id),
  constraint forecast_items_run_same_restaurant_fk
    foreign key (restaurant_id, forecast_run_id) references public.forecast_runs (restaurant_id, id) on delete cascade,
  constraint forecast_items_ingredient_same_restaurant_fk
    foreign key (restaurant_id, ingredient_id) references public.ingredients (restaurant_id, id) on delete cascade
);

create index forecast_items_restaurant_ingredient_idx on public.forecast_items (restaurant_id, ingredient_id);

create function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    nullif(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), ''),
    new.email
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

revoke all on function public.handle_new_auth_user() from public, anon, authenticated;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

create function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := pg_catalog.now();
  return new;
end;
$$;

revoke all on function public.touch_updated_at() from public, anon, authenticated;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles', 'restaurants', 'suppliers', 'ingredients', 'menu_products',
    'recipes', 'sales_imports', 'purchase_orders', 'purchase_order_items'
  ] loop
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.touch_updated_at()',
      table_name || '_touch_updated_at', table_name
    );
  end loop;
end;
$$;

create function public.create_restaurant_with_owner(
  p_name text,
  p_restaurant_type text default null,
  p_location text default null,
  p_currency text default 'THB'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  authenticated_user_id uuid := (select auth.uid());
  new_restaurant_id uuid;
begin
  if authenticated_user_id is null then
    raise exception 'Authentication is required' using errcode = '42501';
  end if;

  if p_name is null or char_length(btrim(p_name)) not between 1 and 120 then
    raise exception 'Restaurant name must be between 1 and 120 characters' using errcode = '22023';
  end if;

  if p_currency is null or p_currency !~ '^[A-Z]{3}$' then
    raise exception 'Currency must be a three-letter uppercase code' using errcode = '22023';
  end if;

  if exists (
    select 1 from public.restaurant_members
    where user_id = authenticated_user_id
  ) then
    raise exception 'This user already belongs to a restaurant' using errcode = '23505';
  end if;

  insert into public.restaurants (name, restaurant_type, location, currency, created_by)
  values (btrim(p_name), nullif(btrim(p_restaurant_type), ''), nullif(btrim(p_location), ''), p_currency, authenticated_user_id)
  returning id into new_restaurant_id;

  insert into public.restaurant_members (restaurant_id, user_id, role)
  values (new_restaurant_id, authenticated_user_id, 'owner');

  return new_restaurant_id;
end;
$$;

revoke all on function public.create_restaurant_with_owner(text, text, text, text) from public, anon, authenticated;
grant execute on function public.create_restaurant_with_owner(text, text, text, text) to authenticated;

create function public.is_restaurant_member(p_restaurant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.restaurant_members as membership
    where membership.restaurant_id = p_restaurant_id
      and membership.user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_restaurant_member(uuid) from public, anon, authenticated;
grant execute on function public.is_restaurant_member(uuid) to authenticated;

create function public.smartstock_connection_check()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select true;
$$;

revoke all on function public.smartstock_connection_check() from public, anon, authenticated;
grant execute on function public.smartstock_connection_check() to anon, authenticated;

alter table public.profiles enable row level security;
alter table public.restaurants enable row level security;
alter table public.restaurant_members enable row level security;

revoke all on table public.profiles, public.restaurants, public.restaurant_members from anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (full_name, avatar_url) on table public.profiles to authenticated;
grant select, update (name, restaurant_type, location, currency) on table public.restaurants to authenticated;
grant select on table public.restaurant_members to authenticated;

create policy profiles_select_self on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy profiles_update_self on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy restaurants_select_member on public.restaurants
  for select to authenticated using ((select public.is_restaurant_member(id)));
create policy restaurants_update_owner on public.restaurants
  for update to authenticated
  using (exists (
    select 1 from public.restaurant_members as membership
    where membership.restaurant_id = id
      and membership.user_id = (select auth.uid())
      and membership.role = 'owner'
  ))
  with check (exists (
    select 1 from public.restaurant_members as membership
    where membership.restaurant_id = id
      and membership.user_id = (select auth.uid())
      and membership.role = 'owner'
  ));
create policy restaurant_members_select_self on public.restaurant_members
  for select to authenticated using ((select auth.uid()) = user_id);

do $$
declare
  table_name text;
  tenant_tables text[] := array[
    'suppliers', 'ingredients', 'menu_products', 'recipes', 'sales_imports',
    'sales_records', 'inventory_movements', 'purchase_orders',
    'purchase_order_items', 'forecast_runs', 'forecast_items'
  ];
begin
  foreach table_name in array tenant_tables loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on table public.%I from anon, authenticated', table_name);
    execute format('grant select, insert, update, delete on table public.%I to authenticated', table_name);

    execute format(
      'create policy %I on public.%I for select to authenticated using ((select public.is_restaurant_member(restaurant_id)))',
      table_name || '_select_member', table_name
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check ((select public.is_restaurant_member(restaurant_id)))',
      table_name || '_insert_member', table_name
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using ((select public.is_restaurant_member(restaurant_id))) with check ((select public.is_restaurant_member(restaurant_id)))',
      table_name || '_update_member', table_name
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using ((select public.is_restaurant_member(restaurant_id)))',
      table_name || '_delete_member', table_name
    );
  end loop;
end;
$$;

-- Owner membership is created only by create_restaurant_with_owner().
-- No client role receives INSERT, UPDATE, or DELETE on restaurant_members.
comment on table public.restaurant_members is 'Membership changes are server-controlled; users can only read their own membership row.';
comment on function public.create_restaurant_with_owner(text, text, text, text) is 'Creates a restaurant and its authenticated owner membership atomically.';
comment on function public.is_restaurant_member(uuid) is 'Returns whether the current authenticated user belongs to a restaurant.';
comment on function public.smartstock_connection_check() is 'Unauthenticated-safe database connectivity probe; returns no project or user data.';

-- Revoke table access grants explicitly for anon and authenticated on every new table.
do $$
declare
  table_name text;
  all_tables text[] := array[
    'profiles', 'restaurants', 'restaurant_members', 'suppliers', 'ingredients',
    'menu_products', 'recipes', 'sales_imports', 'sales_records',
    'inventory_movements', 'purchase_orders', 'purchase_order_items',
    'forecast_runs', 'forecast_items'
  ];
begin
  foreach table_name in array all_tables loop
    execute format('revoke all on table public.%I from anon', table_name);
  end loop;
end;
$$;

-- Keep this probe available to signed-out visitors without granting table access.
revoke all on function public.smartstock_connection_check() from public;
grant execute on function public.smartstock_connection_check() to anon, authenticated;

create index restaurants_created_by_idx on public.restaurants (created_by);
create index inventory_movements_created_by_idx on public.inventory_movements (created_by);
create index sales_imports_created_by_idx on public.sales_imports (created_by);
create index purchase_orders_created_by_idx on public.purchase_orders (created_by);
create index forecast_runs_created_by_idx on public.forecast_runs (created_by);

-- Keep the seed-free schema safe to apply; no demo records or destructive resets are run.

-- Policies are deliberately membership-scoped. Cross-restaurant references are
-- additionally blocked by the composite foreign keys on tenant-owned relations.

-- Follows the least-privilege model: profiles and memberships have no client
-- insert/delete paths, while onboarding and profile creation use trusted functions/triggers.

-- End of initial SmartStock AI schema.
