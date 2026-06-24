alter table public.customers
  add column if not exists business_name text not null default '';

comment on column public.customers.business_name is 'Company / business name for B2B customers.';
