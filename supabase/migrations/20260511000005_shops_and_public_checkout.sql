-- Shops table: public-facing shop profile with unique slug for checkout pages.

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

create index if not exists shops_slug_idx on public.shops (slug);
create index if not exists shops_user_id_idx on public.shops (user_id);

alter table public.shops enable row level security;

-- Owner can manage their own shop
create policy "shops_owner_select"
  on public.shops for select
  to authenticated
  using (auth.uid() = user_id);

create policy "shops_owner_insert"
  on public.shops for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "shops_owner_update"
  on public.shops for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Public (anon) can read any shop for the checkout page
create policy "shops_public_read"
  on public.shops for select
  to anon
  using (true);

-- Public (anon) can read products for a specific shop owner
create policy "products_public_read"
  on public.products for select
  to anon
  using (true);

-- Public (anon) can insert orders (checkout)
create policy "orders_public_insert"
  on public.orders for insert
  to anon
  with check (true);

-- Public (anon) can insert customers (checkout auto-creates)
create policy "customers_public_insert"
  on public.customers for insert
  to anon
  with check (true);
