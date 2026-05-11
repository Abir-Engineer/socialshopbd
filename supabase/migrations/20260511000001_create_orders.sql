-- Orders table + RLS (authenticated users).

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_name text not null,
  amount_bdt integer not null default 0 check (amount_bdt >= 0),
  status text not null default 'pending'
    check (
      status in (
        'pending',
        'confirmed',
        'packed',
        'shipped',
        'delivered',
        'returned'
      )
    ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_order_number_idx on public.orders (order_number);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_created_at_idx on public.orders (created_at desc);

alter table public.orders enable row level security;

create policy "orders_select_authenticated"
  on public.orders for select
  to authenticated
  using (true);

create policy "orders_insert_authenticated"
  on public.orders for insert
  to authenticated
  with check (true);

create policy "orders_update_authenticated"
  on public.orders for update
  to authenticated
  using (true)
  with check (true);

create policy "orders_delete_authenticated"
  on public.orders for delete
  to authenticated
  using (true);
