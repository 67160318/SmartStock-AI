-- Keep the single-workspace onboarding invariant safe under concurrent requests.
create unique index restaurant_members_one_restaurant_per_user_idx
  on public.restaurant_members (user_id);
