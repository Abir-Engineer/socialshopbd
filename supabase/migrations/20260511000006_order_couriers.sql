-- Add courier details to orders table for delivery automation.

alter table public.orders 
add column if not exists courier_name text,
add column if not exists tracking_code text;
