-- CRM customers + link orders to customers for totals / repeat tracking.

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

create index if not exists customers_phone_idx on public.customers (phone);
create index if not exists customers_created_at_idx on public.customers (created_at desc);

alter table public.orders
  add column if not exists customer_id uuid references public.customers (id) on delete set null;

create index if not exists orders_customer_id_idx on public.orders (customer_id);

alter table public.customers enable row level security;

create policy "customers_select_authenticated"
  on public.customers for select
  to authenticated
  using (true);

create policy "customers_insert_authenticated"
  on public.customers for insert
  to authenticated
  with check (true);

create policy "customers_update_authenticated"
  on public.customers for update
  to authenticated
  using (true)
  with check (true);

create policy "customers_delete_authenticated"
  on public.customers for delete
  to authenticated
  using (true);
