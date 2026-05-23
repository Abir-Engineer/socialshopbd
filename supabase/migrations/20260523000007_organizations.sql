-- ============================================================
-- Migration: Organization-based multi-tenant SaaS architecture
-- Safe: additive columns, backfill existing data, updated RLS
-- ============================================================

-- ─── 1. Organizations table ───────────────────────────────────
create table if not exists public.organizations (
  id          uuid    primary key default gen_random_uuid(),
  name        text    not null,
  slug        text    not null,
  plan        text    not null default 'free'
                check (plan in ('free', 'pro', 'enterprise')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint organizations_slug_key unique (slug)
);

create index if not exists organizations_slug_idx on public.organizations (slug);

-- ─── 2. Organization members table ───────────────────────────
create table if not exists public.organization_members (
  id               uuid    primary key default gen_random_uuid(),
  organization_id  uuid    not null references public.organizations (id) on delete cascade,
  user_id          uuid    not null references auth.users (id) on delete cascade,
  role             text    not null default 'member'
                     check (role in ('owner', 'admin', 'member')),
  created_at       timestamptz not null default now(),
  constraint organization_members_unique unique (organization_id, user_id)
);

create index if not exists org_members_user_id_idx on public.organization_members (user_id);
create index if not exists org_members_org_id_idx  on public.organization_members (organization_id);

-- ─── 3. Enable RLS on new tables ─────────────────────────────
alter table public.organizations        enable row level security;
alter table public.organization_members enable row level security;

-- ─── 4. Helper function: get current user's org_id ───────────
-- Used inside all RLS policies so each table row is scoped to the user's org.
create or replace function public.get_user_org_id()
returns uuid
language sql stable security definer
set search_path = public
as $$
  select organization_id
  from   public.organization_members
  where  user_id = auth.uid()
  limit  1;
$$;

-- ─── 5. RLS for organizations ────────────────────────────────
drop policy if exists "orgs_member_select" on public.organizations;
drop policy if exists "orgs_member_update" on public.organizations;

create policy "orgs_member_select"
  on public.organizations for select to authenticated
  using (id = public.get_user_org_id());

create policy "orgs_member_update"
  on public.organizations for update to authenticated
  using (id = public.get_user_org_id())
  with check (id = public.get_user_org_id());

-- ─── 6. RLS for organization_members ─────────────────────────
drop policy if exists "org_members_select" on public.organization_members;

create policy "org_members_select"
  on public.organization_members for select to authenticated
  using (organization_id = public.get_user_org_id());

-- ─── 7. Add organization_id column to core tables (nullable for safe migration) ──
alter table public.products
  add column if not exists organization_id uuid
    references public.organizations (id) on delete cascade;

alter table public.orders
  add column if not exists organization_id uuid
    references public.organizations (id) on delete cascade;

alter table public.customers
  add column if not exists organization_id uuid
    references public.organizations (id) on delete cascade;

alter table public.shops
  add column if not exists organization_id uuid
    references public.organizations (id) on delete cascade;

-- ─── 8. Indexes ───────────────────────────────────────────────
create index if not exists products_org_id_idx   on public.products  (organization_id);
create index if not exists orders_org_id_idx     on public.orders    (organization_id);
create index if not exists customers_org_id_idx  on public.customers (organization_id);
create index if not exists shops_org_id_idx      on public.shops     (organization_id);

-- ─── 9. Backfill: create one org per existing user, set org_id ───
-- For each distinct user_id in existing data:
--   a) create an organization (idempotent)
--   b) add user as owner
--   c) set organization_id on all their rows
do $$
declare
  u          record;
  new_org_id uuid;
  org_slug   text;
begin
  for u in
    select distinct user_id from public.products  where user_id is not null and organization_id is null
    union
    select distinct user_id from public.orders    where user_id is not null and organization_id is null
    union
    select distinct user_id from public.customers where user_id is not null and organization_id is null
    union
    select distinct user_id from public.shops     where user_id is not null and organization_id is null
  loop
    -- Already has an org?
    select organization_id into new_org_id
    from   public.organization_members
    where  user_id = u.user_id
    limit  1;

    if new_org_id is null then
      org_slug := 'org-' || substr(u.user_id::text, 1, 8);

      -- Ensure slug uniqueness
      while exists (select 1 from public.organizations where slug = org_slug) loop
        org_slug := 'org-' || substr(gen_random_uuid()::text, 1, 8);
      end loop;

      insert into public.organizations (name, slug)
      values ('My Business', org_slug)
      returning id into new_org_id;

      insert into public.organization_members (organization_id, user_id, role)
      values (new_org_id, u.user_id, 'owner')
      on conflict do nothing;
    end if;

    -- Backfill org_id
    update public.products   set organization_id = new_org_id where user_id = u.user_id and organization_id is null;
    update public.orders     set organization_id = new_org_id where user_id = u.user_id and organization_id is null;
    update public.customers  set organization_id = new_org_id where user_id = u.user_id and organization_id is null;
    update public.shops      set organization_id = new_org_id where user_id = u.user_id and organization_id is null;
  end loop;
end;
$$;

-- ─── 10. Auto-create organization on new user signup (trigger) ────
create or replace function public.handle_new_user_organization()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  new_org_id uuid;
  org_name   text;
  org_slug   text;
begin
  org_name := coalesce(split_part(new.email, '@', 1), 'My Business');
  org_slug  := 'org-' || substr(new.id::text, 1, 8);

  -- Ensure unique slug
  while exists (select 1 from public.organizations where slug = org_slug) loop
    org_slug := 'org-' || substr(gen_random_uuid()::text, 1, 8);
  end loop;

  insert into public.organizations (name, slug)
  values (org_name, org_slug)
  returning id into new_org_id;

  insert into public.organization_members (organization_id, user_id, role)
  values (new_org_id, new.id, 'owner');

  return new;
end;
$$;

-- Drop old trigger if it exists before recreating
drop trigger if exists on_auth_user_created_organization on auth.users;

create trigger on_auth_user_created_organization
  after insert on auth.users
  for each row execute function public.handle_new_user_organization();

-- ─── 11. Update RLS policies — Products ──────────────────────
drop policy if exists "products_select_authenticated" on public.products;
drop policy if exists "products_insert_authenticated" on public.products;
drop policy if exists "products_update_authenticated" on public.products;
drop policy if exists "products_delete_authenticated" on public.products;
-- Also drop old anon public checkout policy and re-add below
drop policy if exists "products_public_read"          on public.products;

create policy "products_select_org"
  on public.products for select to authenticated
  using (organization_id = public.get_user_org_id());

create policy "products_insert_org"
  on public.products for insert to authenticated
  with check (organization_id = public.get_user_org_id());

create policy "products_update_org"
  on public.products for update to authenticated
  using    (organization_id = public.get_user_org_id())
  with check (organization_id = public.get_user_org_id());

create policy "products_delete_org"
  on public.products for delete to authenticated
  using (organization_id = public.get_user_org_id());

-- Anon (public checkout) can read products of any org
create policy "products_public_read"
  on public.products for select to anon
  using (organization_id is not null);

-- ─── 12. Update RLS policies — Orders ────────────────────────
drop policy if exists "orders_select_authenticated" on public.orders;
drop policy if exists "orders_insert_authenticated" on public.orders;
drop policy if exists "orders_update_authenticated" on public.orders;
drop policy if exists "orders_delete_authenticated" on public.orders;
drop policy if exists "orders_public_insert"        on public.orders;

create policy "orders_select_org"
  on public.orders for select to authenticated
  using (organization_id = public.get_user_org_id());

create policy "orders_insert_org"
  on public.orders for insert to authenticated
  with check (organization_id = public.get_user_org_id());

create policy "orders_update_org"
  on public.orders for update to authenticated
  using    (organization_id = public.get_user_org_id())
  with check (organization_id = public.get_user_org_id());

create policy "orders_delete_org"
  on public.orders for delete to authenticated
  using (organization_id = public.get_user_org_id());

-- Anon checkout: must supply a valid org_id (set by checkout page from shop)
create policy "orders_public_insert"
  on public.orders for insert to anon
  with check (organization_id is not null);

-- ─── 13. Update RLS policies — Customers ─────────────────────
drop policy if exists "customers_select_authenticated" on public.customers;
drop policy if exists "customers_insert_authenticated" on public.customers;
drop policy if exists "customers_update_authenticated" on public.customers;
drop policy if exists "customers_delete_authenticated" on public.customers;
drop policy if exists "customers_public_insert"        on public.customers;

create policy "customers_select_org"
  on public.customers for select to authenticated
  using (organization_id = public.get_user_org_id());

create policy "customers_insert_org"
  on public.customers for insert to authenticated
  with check (organization_id = public.get_user_org_id());

create policy "customers_update_org"
  on public.customers for update to authenticated
  using    (organization_id = public.get_user_org_id())
  with check (organization_id = public.get_user_org_id());

create policy "customers_delete_org"
  on public.customers for delete to authenticated
  using (organization_id = public.get_user_org_id());

-- Anon checkout: must supply a valid org_id
create policy "customers_public_insert"
  on public.customers for insert to anon
  with check (organization_id is not null);

-- ─── 14. Update RLS policies — Order Items ───────────────────
drop policy if exists "order_items_select_authenticated" on public.order_items;
drop policy if exists "order_items_insert_authenticated" on public.order_items;
drop policy if exists "order_items_update_authenticated" on public.order_items;
drop policy if exists "order_items_delete_authenticated" on public.order_items;

create policy "order_items_select_org"
  on public.order_items for select to authenticated
  using (exists (
    select 1 from public.orders o
    where  o.id = order_items.order_id
    and    o.organization_id = public.get_user_org_id()
  ));

create policy "order_items_insert_org"
  on public.order_items for insert to authenticated
  with check (exists (
    select 1 from public.orders o
    where  o.id = order_items.order_id
    and    o.organization_id = public.get_user_org_id()
  ));

create policy "order_items_update_org"
  on public.order_items for update to authenticated
  using (exists (
    select 1 from public.orders o
    where  o.id = order_items.order_id
    and    o.organization_id = public.get_user_org_id()
  ))
  with check (exists (
    select 1 from public.orders o
    where  o.id = order_items.order_id
    and    o.organization_id = public.get_user_org_id()
  ));

create policy "order_items_delete_org"
  on public.order_items for delete to authenticated
  using (exists (
    select 1 from public.orders o
    where  o.id = order_items.order_id
    and    o.organization_id = public.get_user_org_id()
  ));
