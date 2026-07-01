-- New columns on orders
alter table public.orders
  add column if not exists payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'paid', 'partial', 'refunded')),
  add column if not exists advance_bdt integer not null default 0,
  add column if not exists delivery_charge_bdt integer not null default 0,
  add column if not exists discount_bdt integer not null default 0,
  add column if not exists coupon_code text,
  add column if not exists coupon_discount_bdt integer not null default 0,
  add column if not exists notes text not null default '',
  add column if not exists order_phone text,
  add column if not exists order_address text;

-- Update order_items with snapshot fields
alter table public.order_items
  add column if not exists product_name text,
  add column if not exists product_sku text,
  add column if not exists unit_price_bdt integer,
  add column if not exists discount_bdt integer not null default 0;

-- Order timeline
create table if not exists public.order_timeline (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status text not null,
  note text not null default '',
  created_by text,
  created_at timestamptz not null default now()
);
alter table public.order_timeline enable row level security;

create policy "Authenticated users can view timeline"
  on public.order_timeline for select to authenticated using (true);
create policy "Authenticated users can insert timeline"
  on public.order_timeline for insert to authenticated with check (true);

create index if not exists idx_order_timeline_order_id on public.order_timeline(order_id);
create index if not exists idx_order_timeline_created_at on public.order_timeline(created_at desc);

-- Order comments (internal)
create table if not exists public.order_comments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  author text not null,
  content text not null,
  is_internal boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.order_comments enable row level security;

create policy "Authenticated users can view comments"
  on public.order_comments for select to authenticated using (true);
create policy "Authenticated users can insert comments"
  on public.order_comments for insert to authenticated with check (true);

create index if not exists idx_order_comments_order_id on public.order_comments(order_id);
create index if not exists idx_order_comments_created_at on public.order_comments(created_at desc);
