-- Line items for revenue-by-product analytics (optional; empty until populated).

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  quantity integer not null check (quantity > 0),
  line_total_bdt integer not null default 0 check (line_total_bdt >= 0),
  created_at timestamptz not null default now()
);

create index if not exists order_items_order_id_idx on public.order_items (order_id);
create index if not exists order_items_product_id_idx on public.order_items (product_id);

alter table public.order_items enable row level security;

create policy "order_items_select_authenticated"
  on public.order_items for select
  to authenticated
  using (true);

create policy "order_items_insert_authenticated"
  on public.order_items for insert
  to authenticated
  with check (true);

create policy "order_items_update_authenticated"
  on public.order_items for update
  to authenticated
  using (true)
  with check (true);

create policy "order_items_delete_authenticated"
  on public.order_items for delete
  to authenticated
  using (true);
