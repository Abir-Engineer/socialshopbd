-- Run in Supabase SQL Editor or via CLI: products table + RLS for authenticated users.

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sku text not null unique,
  stock integer not null default 0 check (stock >= 0),
  price_bdt integer not null default 0 check (price_bdt >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_sku_idx on public.products (sku);

alter table public.products enable row level security;

create policy "products_select_authenticated"
  on public.products for select
  to authenticated
  using (true);

create policy "products_insert_authenticated"
  on public.products for insert
  to authenticated
  with check (true);

create policy "products_update_authenticated"
  on public.products for update
  to authenticated
  using (true)
  with check (true);

create policy "products_delete_authenticated"
  on public.products for delete
  to authenticated
  using (true);
