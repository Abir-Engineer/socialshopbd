-- ============================================================
-- Complete Fix Script — run once in Supabase SQL Editor
-- Safe to re-run (idempotent)
-- ============================================================

-- ─── Drop conflicting policies from early migrations ────────
do $$ declare
  rec record;
begin
  for rec in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and policyname in (
        'customers_select_authenticated',
        'customers_insert_authenticated',
        'customers_update_authenticated',
        'customers_delete_authenticated',
        'orders_select_authenticated',
        'orders_insert_authenticated',
        'orders_update_authenticated',
        'orders_delete_authenticated',
        'products_select_authenticated',
        'products_insert_authenticated',
        'products_update_authenticated',
        'products_delete_authenticated',
        'order_items_select_authenticated',
        'order_items_insert_authenticated',
        'order_items_update_authenticated',
        'order_items_delete_authenticated',
        'products_public_read',
        'orders_public_insert',
        'customers_public_insert',
        'shops_owner_select',
        'shops_owner_insert',
        'shops_owner_update',
        'shops_public_read'
      )
  loop
    execute format('drop policy if exists %I on %I.%I', rec.policyname, rec.schemaname, rec.tablename);
  end loop;
end $$;

-- ─── Core tables (safe: IF NOT EXISTS) ──────────────────────
create table if not exists public.organizations (
  id          uuid    primary key default gen_random_uuid(),
  name        text    not null,
  slug        text    not null,
  plan        text    not null default 'free'
                check (plan in ('free', 'free_trial', 'pro', 'enterprise')),
  subscription_status    text,
  trial_ends_at         timestamptz default (now() + interval '14 days'),
  current_period_end    timestamptz,
  stripe_customer_id    text,
  stripe_subscription_id text,
  billing_email         text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint organizations_slug_key unique (slug)
);

create table if not exists public.organization_members (
  id               uuid    primary key default gen_random_uuid(),
  organization_id  uuid    not null references public.organizations (id) on delete cascade,
  user_id          uuid    not null references auth.users (id) on delete cascade,
  role             text    not null default 'viewer',
  created_at       timestamptz not null default now(),
  constraint organization_members_unique unique (organization_id, user_id)
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sku text not null unique,
  stock integer not null default 0 check (stock >= 0),
  price_bdt integer not null default 0 check (price_bdt >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_name text not null,
  amount_bdt integer not null default 0 check (amount_bdt >= 0),
  status text not null default 'pending'
    check (status in ('pending','confirmed','packed','shipped','delivered','returned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customers_phone_key unique (phone)
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  quantity integer not null check (quantity > 0),
  line_total_bdt integer not null default 0 check (line_total_bdt >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.shops (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  shop_name text not null,
  slug text not null,
  currency text not null default 'BDT',
  phone text not null default '',
  address text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shops_slug_key unique (slug),
  constraint shops_user_id_key unique (user_id)
);

-- ─── Add org columns (safe: IF NOT EXISTS) ──────────────────
alter table public.organizations add column if not exists owner_id uuid references auth.users (id) on delete set null;
alter table public.products     add column if not exists organization_id uuid references public.organizations (id) on delete cascade;
alter table public.orders       add column if not exists organization_id uuid references public.organizations (id) on delete cascade;
alter table public.customers    add column if not exists organization_id uuid references public.organizations (id) on delete cascade;
alter table public.shops        add column if not exists organization_id uuid references public.organizations (id) on delete cascade;
alter table public.orders       add column if not exists customer_id uuid references public.customers (id) on delete set null;

-- ─── Indexes ────────────────────────────────────────────────
create index if not exists organizations_slug_idx       on public.organizations (slug);
create index if not exists organizations_owner_id_idx   on public.organizations (owner_id);
create index if not exists org_members_user_id_idx      on public.organization_members (user_id);
create index if not exists org_members_org_id_idx       on public.organization_members (organization_id);
create index if not exists products_org_id_idx          on public.products  (organization_id);
create index if not exists products_sku_idx             on public.products  (sku);
create index if not exists orders_org_id_idx            on public.orders    (organization_id);
create index if not exists orders_customer_id_idx       on public.orders    (customer_id);
create index if not exists orders_order_number_idx      on public.orders    (order_number);
create index if not exists orders_status_idx            on public.orders    (status);
create index if not exists orders_created_at_idx        on public.orders    (created_at desc);
create index if not exists customers_org_id_idx         on public.customers (organization_id);
create index if not exists customers_phone_idx          on public.customers (phone);
create index if not exists customers_created_at_idx     on public.customers (created_at desc);
create index if not exists order_items_order_id_idx     on public.order_items (order_id);
create index if not exists order_items_product_id_idx   on public.order_items (product_id);
create index if not exists shops_org_id_idx             on public.shops     (organization_id);
create index if not exists shops_slug_idx               on public.shops     (slug);
create index if not exists shops_user_id_idx            on public.shops     (user_id);

-- ─── Enable RLS on all tables ───────────────────────────────
alter table public.organizations        enable row level security;
alter table public.organization_members enable row level security;
alter table public.products             enable row level security;
alter table public.orders               enable row level security;
alter table public.customers            enable row level security;
alter table public.order_items          enable row level security;
alter table public.shops                enable row level security;

-- ─── Helper: get_user_org_id (bypasses RLS via SECURITY DEFINER) ─
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

-- ─── Helper: get_user_org_role ──────────────────────────────
create or replace function public.get_user_org_role()
returns text
language sql stable security definer
set search_path = public
as $$
  select role
  from   public.organization_members
  where  user_id = auth.uid()
  limit  1;
$$;

-- ─── Backfill: org + owner for every user without one ───────
do $$
declare
  u record;
  new_org_id uuid;
  org_slug   text;
  org_name   text;
begin
  for u in
    select id, email from auth.users
    where id not in (select user_id from public.organization_members)
  loop
    org_name := coalesce(split_part(u.email, '@', 1), 'My Business');
    org_slug := 'org-' || substring(u.id::text, 1, 8);

    while exists (select 1 from public.organizations where slug = org_slug) loop
      org_slug := 'org-' || substring(gen_random_uuid()::text, 1, 8);
    end loop;

    insert into public.organizations (name, slug, owner_id)
    values (org_name, org_slug, u.id)
    on conflict (slug) do nothing
    returning id into new_org_id;

    if new_org_id is null then
      select id into new_org_id from public.organizations where slug = org_slug;
    end if;

    insert into public.organization_members (organization_id, user_id, role)
    values (new_org_id, u.id, 'owner')
    on conflict (organization_id, user_id) do nothing;
  end loop;
end;
$$;

-- ─── Fix role CHECK constraint ──────────────────────────────
alter table public.organization_members
  drop constraint if exists organization_members_role_check;

alter table public.organization_members
  add constraint organization_members_role_check
  check (role in ('owner', 'admin', 'manager', 'staff', 'viewer'));

-- ─── RLS: organization_members ──────────────────────────────
drop policy if exists "org_members_select" on public.organization_members;
drop policy if exists "org_members_insert" on public.organization_members;
drop policy if exists "org_members_update" on public.organization_members;
drop policy if exists "org_members_delete" on public.organization_members;

create policy "org_members_select"
  on public.organization_members for select to authenticated
  using (organization_id = public.get_user_org_id());

create policy "org_members_insert"
  on public.organization_members for insert to authenticated
  with check (
    (organization_id = public.get_user_org_id() and public.get_user_org_role() in ('owner', 'admin'))
    or
    (user_id = auth.uid() and role = 'owner' and not exists (
      select 1 from public.organization_members where user_id = auth.uid()
    ))
  );

create policy "org_members_update"
  on public.organization_members for update to authenticated
  using (organization_id = public.get_user_org_id() and public.get_user_org_role() in ('owner', 'admin'))
  with check (organization_id = public.get_user_org_id() and public.get_user_org_role() in ('owner', 'admin'));

create policy "org_members_delete"
  on public.organization_members for delete to authenticated
  using (organization_id = public.get_user_org_id() and public.get_user_org_role() in ('owner', 'admin'));

-- ─── RLS: organizations ─────────────────────────────────────
drop policy if exists "orgs_insert_self"  on public.organizations;
drop policy if exists "orgs_select_self"  on public.organizations;
drop policy if exists "orgs_update_self"  on public.organizations;
drop policy if exists "orgs_delete_self"  on public.organizations;

create policy "orgs_insert_self"
  on public.organizations for insert to authenticated
  with check (owner_id = auth.uid());

create policy "orgs_select_self"
  on public.organizations for select to authenticated
  using (owner_id = auth.uid());

create policy "orgs_update_self"
  on public.organizations for update to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "orgs_delete_self"
  on public.organizations for delete to authenticated
  using (owner_id = auth.uid());

-- ─── RLS: products ──────────────────────────────────────────
drop policy if exists "products_select_org" on public.products;
drop policy if exists "products_insert_org" on public.products;
drop policy if exists "products_update_org" on public.products;
drop policy if exists "products_delete_org" on public.products;
drop policy if exists "products_public_read" on public.products;

create policy "products_select_org"
  on public.products for select to authenticated
  using (organization_id = public.get_user_org_id());

create policy "products_insert_org"
  on public.products for insert to authenticated
  with check (organization_id = public.get_user_org_id() and public.get_user_org_role() in ('owner', 'admin', 'manager', 'staff'));

create policy "products_update_org"
  on public.products for update to authenticated
  using (organization_id = public.get_user_org_id() and public.get_user_org_role() in ('owner', 'admin', 'manager', 'staff'))
  with check (organization_id = public.get_user_org_id() and public.get_user_org_role() in ('owner', 'admin', 'manager', 'staff'));

create policy "products_delete_org"
  on public.products for delete to authenticated
  using (organization_id = public.get_user_org_id() and public.get_user_org_role() in ('owner', 'admin', 'manager', 'staff'));

create policy "products_public_read"
  on public.products for select to anon
  using (organization_id is not null);

-- ─── RLS: orders ────────────────────────────────────────────
drop policy if exists "orders_select_org" on public.orders;
drop policy if exists "orders_insert_org" on public.orders;
drop policy if exists "orders_update_org" on public.orders;
drop policy if exists "orders_delete_org" on public.orders;
drop policy if exists "orders_public_insert" on public.orders;

create policy "orders_select_org"
  on public.orders for select to authenticated
  using (organization_id = public.get_user_org_id());

create policy "orders_insert_org"
  on public.orders for insert to authenticated
  with check (organization_id = public.get_user_org_id() and public.get_user_org_role() in ('owner', 'admin', 'manager', 'staff'));

create policy "orders_update_org"
  on public.orders for update to authenticated
  using (organization_id = public.get_user_org_id() and public.get_user_org_role() in ('owner', 'admin', 'manager', 'staff'))
  with check (organization_id = public.get_user_org_id() and public.get_user_org_role() in ('owner', 'admin', 'manager', 'staff'));

create policy "orders_delete_org"
  on public.orders for delete to authenticated
  using (organization_id = public.get_user_org_id() and public.get_user_org_role() in ('owner', 'admin', 'manager', 'staff'));

create policy "orders_public_insert"
  on public.orders for insert to anon
  with check (organization_id is not null);

-- ─── RLS: customers ─────────────────────────────────────────
drop policy if exists "customers_select_org" on public.customers;
drop policy if exists "customers_insert_org" on public.customers;
drop policy if exists "customers_update_org" on public.customers;
drop policy if exists "customers_delete_org" on public.customers;
drop policy if exists "customers_public_insert" on public.customers;

create policy "customers_select_org"
  on public.customers for select to authenticated
  using (organization_id = public.get_user_org_id());

create policy "customers_insert_org"
  on public.customers for insert to authenticated
  with check (organization_id = public.get_user_org_id() and public.get_user_org_role() in ('owner', 'admin', 'manager', 'staff'));

create policy "customers_update_org"
  on public.customers for update to authenticated
  using (organization_id = public.get_user_org_id() and public.get_user_org_role() in ('owner', 'admin', 'manager', 'staff'))
  with check (organization_id = public.get_user_org_id() and public.get_user_org_role() in ('owner', 'admin', 'manager', 'staff'));

create policy "customers_delete_org"
  on public.customers for delete to authenticated
  using (organization_id = public.get_user_org_id() and public.get_user_org_role() in ('owner', 'admin', 'manager', 'staff'));

create policy "customers_public_insert"
  on public.customers for insert to anon
  with check (organization_id is not null);

-- ─── RLS: order_items ───────────────────────────────────────
drop policy if exists "order_items_select_org" on public.order_items;
drop policy if exists "order_items_insert_org" on public.order_items;
drop policy if exists "order_items_update_org" on public.order_items;
drop policy if exists "order_items_delete_org" on public.order_items;

create policy "order_items_select_org"
  on public.order_items for select to authenticated
  using (exists (
    select 1 from public.orders o
    where o.id = order_items.order_id and o.organization_id = public.get_user_org_id()
  ));

create policy "order_items_insert_org"
  on public.order_items for insert to authenticated
  with check (exists (
    select 1 from public.orders o
    where o.id = order_items.order_id and o.organization_id = public.get_user_org_id()
    and public.get_user_org_role() in ('owner', 'admin', 'manager', 'staff')
  ));

create policy "order_items_update_org"
  on public.order_items for update to authenticated
  using (exists (
    select 1 from public.orders o
    where o.id = order_items.order_id and o.organization_id = public.get_user_org_id()
    and public.get_user_org_role() in ('owner', 'admin', 'manager', 'staff')
  ))
  with check (exists (
    select 1 from public.orders o
    where o.id = order_items.order_id and o.organization_id = public.get_user_org_id()
    and public.get_user_org_role() in ('owner', 'admin', 'manager', 'staff')
  ));

create policy "order_items_delete_org"
  on public.order_items for delete to authenticated
  using (exists (
    select 1 from public.orders o
    where o.id = order_items.order_id and o.organization_id = public.get_user_org_id()
    and public.get_user_org_role() in ('owner', 'admin', 'manager', 'staff')
  ));

-- ─── RLS: shops ─────────────────────────────────────────────
drop policy if exists "shops_select_org" on public.shops;
drop policy if exists "shops_insert_org" on public.shops;
drop policy if exists "shops_update_org" on public.shops;
drop policy if exists "shops_delete_org" on public.shops;
drop policy if exists "shops_public_read" on public.shops;

create policy "shops_select_org"
  on public.shops for select to authenticated
  using (organization_id = public.get_user_org_id());

create policy "shops_insert_org"
  on public.shops for insert to authenticated
  with check (organization_id = public.get_user_org_id() and public.get_user_org_role() in ('owner', 'admin', 'manager'));

create policy "shops_update_org"
  on public.shops for update to authenticated
  using (organization_id = public.get_user_org_id() and public.get_user_org_role() in ('owner', 'admin'))
  with check (organization_id = public.get_user_org_id() and public.get_user_org_role() in ('owner', 'admin'));

create policy "shops_delete_org"
  on public.shops for delete to authenticated
  using (organization_id = public.get_user_org_id() and public.get_user_org_role() in ('owner', 'admin'));

create policy "shops_public_read"
  on public.shops for select to anon
  using (true);

-- ─── Trigger: auto-create org on new signup ─────────────────
create or replace function public.handle_new_user_organization()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  new_org_id uuid;
  org_name   text;
  org_slug   text;
  pending_invite record;
begin
  select * into pending_invite
  from public.organization_invitations
  where email = new.email and status = 'pending' and expires_at > now()
  limit 1;

  if pending_invite.id is not null then
    insert into public.organization_members (organization_id, user_id, role)
    values (pending_invite.organization_id, new.id, pending_invite.role)
    on conflict (organization_id, user_id) do nothing;

    update public.organization_invitations
    set status = 'accepted'
    where id = pending_invite.id;

    return new;
  end if;

  org_name := coalesce(split_part(new.email, '@', 1), 'My Business');
  org_slug := 'org-' || substring(new.id::text, 1, 8);

  while exists (select 1 from public.organizations where slug = org_slug) loop
    org_slug := 'org-' || substring(gen_random_uuid()::text, 1, 8);
  end loop;

  insert into public.organizations (name, slug, owner_id)
  values (org_name, org_slug, new.id)
  returning id into new_org_id;

  insert into public.organization_members (organization_id, user_id, role)
  values (new_org_id, new.id, 'owner')
  on conflict (organization_id, user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_organization on auth.users;
create trigger on_auth_user_created_organization
  after insert on auth.users
  for each row execute function public.handle_new_user_organization();
