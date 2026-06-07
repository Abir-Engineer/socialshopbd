-- ============================================================
-- Backfill: Create organizations & members for existing users
-- Run this in your Supabase SQL Editor AFTER all migrations.
-- Safe to re-run (idempotent).
-- ============================================================

do $$
declare
  u record;
  new_org_id uuid;
  org_slug   text;
  org_name   text;
begin
  for u in
    select id, email from auth.users
    where id not in (
      select user_id from public.organization_members
    )
  loop
    org_name := coalesce(split_part(u.email, '@', 1), 'My Business');
    org_slug := 'org-' || substr(u.id::text, 1, 8);

    while exists (select 1 from public.organizations where slug = org_slug) loop
      org_slug := 'org-' || substr(gen_random_uuid()::text, 1, 8);
    end loop;

    insert into public.organizations (name, slug, owner_id)
    values (org_name, org_slug, u.id)
    returning id into new_org_id;

    insert into public.organization_members (organization_id, user_id, role)
    values (new_org_id, u.id, 'owner');
  end loop;
end;
$$;

-- ============================================================
-- Fix: update role check constraint to include all valid roles
-- (in case a previous migration's CREATE TABLE IF NOT EXISTS
--  left the old constraint in place)
-- ============================================================
ALTER TABLE public.organization_members DROP CONSTRAINT IF EXISTS organization_members_role_check;
ALTER TABLE public.organization_members ADD CONSTRAINT organization_members_role_check
  CHECK (role IN ('owner', 'admin', 'manager', 'staff', 'viewer'));
