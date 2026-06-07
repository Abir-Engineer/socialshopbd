-- ============================================================
-- Fix: Add missing columns to existing organizations table
-- The original table was created without subscription/billing
-- columns that fix_all.sql assumed existed.
-- ============================================================

alter table public.organizations
  add column if not exists subscription_status    text,
  add column if not exists trial_ends_at          timestamptz default (now() + interval '14 days'),
  add column if not exists current_period_end     timestamptz,
  add column if not exists stripe_customer_id     text,
  add column if not exists stripe_subscription_id text,
  add column if not exists billing_email          text,
  add column if not exists owner_id               uuid references auth.users (id) on delete set null;

-- Refresh PostgREST schema cache
notify pgrst, 'reload schema';
