-- Migration: Add user_id to products, orders, and customers to support multi-tenant isolation.

-- 1. Alter Customers table
alter table public.customers
  add column if not exists user_id uuid references auth.users (id) on delete cascade default auth.uid();

-- 2. Alter Products table
alter table public.products
  add column if not exists user_id uuid references auth.users (id) on delete cascade default auth.uid();

-- 3. Alter Orders table
alter table public.orders
  add column if not exists user_id uuid references auth.users (id) on delete cascade default auth.uid();

-- 4. Re-create RLS Policies with Tenant Isolation

-- Drop existing policies
drop policy if exists "products_select_authenticated" on public.products;
drop policy if exists "products_insert_authenticated" on public.products;
drop policy if exists "products_update_authenticated" on public.products;
drop policy if exists "products_delete_authenticated" on public.products;

drop policy if exists "orders_select_authenticated" on public.orders;
drop policy if exists "orders_insert_authenticated" on public.orders;
drop policy if exists "orders_update_authenticated" on public.orders;
drop policy if exists "orders_delete_authenticated" on public.orders;

drop policy if exists "customers_select_authenticated" on public.customers;
drop policy if exists "customers_insert_authenticated" on public.customers;
drop policy if exists "customers_update_authenticated" on public.customers;
drop policy if exists "customers_delete_authenticated" on public.customers;

drop policy if exists "order_items_select_authenticated" on public.order_items;
drop policy if exists "order_items_insert_authenticated" on public.order_items;
drop policy if exists "order_items_update_authenticated" on public.order_items;
drop policy if exists "order_items_delete_authenticated" on public.order_items;

-- Create secure policies for Products
create policy "products_select_authenticated"
  on public.products for select
  to authenticated
  using (auth.uid() = user_id);

create policy "products_insert_authenticated"
  on public.products for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "products_update_authenticated"
  on public.products for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "products_delete_authenticated"
  on public.products for delete
  to authenticated
  using (auth.uid() = user_id);

-- Create secure policies for Orders
create policy "orders_select_authenticated"
  on public.orders for select
  to authenticated
  using (auth.uid() = user_id);

create policy "orders_insert_authenticated"
  on public.orders for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "orders_update_authenticated"
  on public.orders for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "orders_delete_authenticated"
  on public.orders for delete
  to authenticated
  using (auth.uid() = user_id);

-- Create secure policies for Customers
create policy "customers_select_authenticated"
  on public.customers for select
  to authenticated
  using (auth.uid() = user_id);

create policy "customers_insert_authenticated"
  on public.customers for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "customers_update_authenticated"
  on public.customers for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "customers_delete_authenticated"
  on public.customers for delete
  to authenticated
  using (auth.uid() = user_id);

-- Create secure policies for Order Items (checking through associated Order)
create policy "order_items_select_authenticated"
  on public.order_items for select
  to authenticated
  using (exists (
    select 1 from public.orders
    where orders.id = order_items.order_id
      and orders.user_id = auth.uid()
  ));

create policy "order_items_insert_authenticated"
  on public.order_items for insert
  to authenticated
  with check (exists (
    select 1 from public.orders
    where orders.id = order_items.order_id
      and orders.user_id = auth.uid()
  ));

create policy "order_items_update_authenticated"
  on public.order_items for update
  to authenticated
  using (exists (
    select 1 from public.orders
    where orders.id = order_items.order_id
      and orders.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.orders
    where orders.id = order_items.order_id
      and orders.user_id = auth.uid()
  ));

create policy "order_items_delete_authenticated"
  on public.order_items for delete
  to authenticated
  using (exists (
    select 1 from public.orders
    where orders.id = order_items.order_id
      and orders.user_id = auth.uid()
  ));
