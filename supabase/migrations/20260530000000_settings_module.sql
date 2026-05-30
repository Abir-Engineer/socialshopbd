-- ============================================================
-- Migration: Settings Module
-- Self-contained: creates foundation tables/functions if missing,
-- then adds shops columns, business_info, notifications,
-- subscriptions, and org-scoped RLS policies.
-- ============================================================

-- ─── 0. Foundation: organizations + helpers (if missing) ────
-- These are created by earlier migrations; this section ensures
-- the settings module works on a fresh project.

CREATE TABLE IF NOT EXISTS public.organizations (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name              text NOT NULL DEFAULT '',
  slug              text NOT NULL DEFAULT '',
  owner_id          uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  plan              text NOT NULL DEFAULT 'free',
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT organizations_slug_key UNIQUE (slug)
);

CREATE TABLE IF NOT EXISTS public.organization_members (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  user_id           uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  role              text NOT NULL DEFAULT 'member',
  created_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT organization_members_unique UNIQUE (organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS organizations_owner_id_idx ON public.organizations (owner_id);
CREATE INDEX IF NOT EXISTS org_members_org_id_idx ON public.organization_members (organization_id);
CREATE INDEX IF NOT EXISTS org_members_user_id_idx ON public.organization_members (user_id);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Helper: get current user's organization ID
-- SECURITY DEFINER bypasses RLS to avoid recursive policy evaluation.
CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id
  FROM public.organization_members
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- Helper: get current user's role in their org
CREATE OR REPLACE FUNCTION public.get_user_org_role()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.organization_members
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- RLS: organizations (idempotent)
DROP POLICY IF EXISTS "orgs_insert_self" ON public.organizations;
DROP POLICY IF EXISTS "orgs_select_self" ON public.organizations;
DROP POLICY IF EXISTS "orgs_update_self" ON public.organizations;
DROP POLICY IF EXISTS "orgs_delete_self" ON public.organizations;

CREATE POLICY "orgs_insert_self" ON public.organizations FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());
CREATE POLICY "orgs_select_self" ON public.organizations FOR SELECT TO authenticated
  USING (owner_id = auth.uid());
CREATE POLICY "orgs_update_self" ON public.organizations FOR UPDATE TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "orgs_delete_self" ON public.organizations FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

-- RLS: organization_members (idempotent)
DROP POLICY IF EXISTS "org_members_select" ON public.organization_members;
DROP POLICY IF EXISTS "org_members_insert" ON public.organization_members;
DROP POLICY IF EXISTS "org_members_update" ON public.organization_members;
DROP POLICY IF EXISTS "org_members_delete" ON public.organization_members;

CREATE POLICY "org_members_select" ON public.organization_members FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id());
CREATE POLICY "org_members_insert" ON public.organization_members FOR INSERT TO authenticated
  WITH CHECK (
    (organization_id = public.get_user_org_id() AND public.get_user_org_role() IN ('owner', 'admin'))
    OR
    (user_id = auth.uid() AND role = 'owner' AND NOT EXISTS (
      SELECT 1 FROM public.organization_members WHERE user_id = auth.uid()
    ))
  );
CREATE POLICY "org_members_update" ON public.organization_members FOR UPDATE TO authenticated
  USING (organization_id = public.get_user_org_id() AND public.get_user_org_role() IN ('owner', 'admin'))
  WITH CHECK (organization_id = public.get_user_org_id() AND public.get_user_org_role() IN ('owner', 'admin'));
CREATE POLICY "org_members_delete" ON public.organization_members FOR DELETE TO authenticated
  USING (organization_id = public.get_user_org_id() AND public.get_user_org_role() IN ('owner', 'admin'));

-- ─── 0b. Backfill: create org for every existing user ───────
-- Migration created empty tables; existing auth users need an org
-- so they aren't stuck on /onboarding forever.
DO $$
DECLARE
  u           record;
  new_org_id  uuid;
  org_slug    text;
BEGIN
  FOR u IN
    SELECT id, email FROM auth.users
    WHERE id NOT IN (SELECT user_id FROM public.organization_members)
  LOOP
    org_slug := 'org-' || substr(u.id::text, 1, 8);

    WHILE EXISTS (SELECT 1 FROM public.organizations WHERE slug = org_slug) LOOP
      org_slug := 'org-' || substr(gen_random_uuid()::text, 1, 8);
    END LOOP;

    INSERT INTO public.organizations (name, slug, owner_id)
    VALUES (
      COALESCE(split_part(u.email, '@', 1), 'My Shop'),
      org_slug,
      u.id
    )
    RETURNING id INTO new_org_id;

    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (new_org_id, u.id, 'owner');
  END LOOP;
END;
$$;

-- ─── 1. Shops: create if missing, add columns, RLS ──────────
-- The shops table may not exist if earlier migrations were skipped.
-- This block handles both fresh and existing setups.
CREATE TABLE IF NOT EXISTS public.shops (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  organization_id   uuid REFERENCES public.organizations (id) ON DELETE CASCADE,
  shop_name         text NOT NULL DEFAULT '',
  slug              text NOT NULL DEFAULT '',
  description       text NOT NULL DEFAULT '',
  address           text NOT NULL DEFAULT '',
  currency          text NOT NULL DEFAULT 'BDT',
  phone             text NOT NULL DEFAULT '',
  logo_url          text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT shops_slug_key UNIQUE (slug),
  CONSTRAINT shops_user_id_key UNIQUE (user_id)
);

-- Safely add columns that may be missing on re-run
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '';
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations (id) ON DELETE CASCADE;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS phone text NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS shops_slug_idx ON public.shops (slug);
CREATE INDEX IF NOT EXISTS shops_user_id_idx ON public.shops (user_id);
CREATE INDEX IF NOT EXISTS shops_org_id_idx ON public.shops (organization_id);

-- Update shops RLS to org-scoped (backward-compatible with user_id)
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shops_owner_select" ON public.shops;
DROP POLICY IF EXISTS "shops_owner_insert" ON public.shops;
DROP POLICY IF EXISTS "shops_owner_update" ON public.shops;
DROP POLICY IF EXISTS "shops_select_org"  ON public.shops;
DROP POLICY IF EXISTS "shops_insert_org"  ON public.shops;
DROP POLICY IF EXISTS "shops_update_org"  ON public.shops;
DROP POLICY IF EXISTS "shops_public_read" ON public.shops;

CREATE POLICY "shops_select_org"
  ON public.shops FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id() OR auth.uid() = user_id);

CREATE POLICY "shops_insert_org"
  ON public.shops FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.get_user_org_id() OR auth.uid() = user_id);

CREATE POLICY "shops_update_org"
  ON public.shops FOR UPDATE TO authenticated
  USING (organization_id = public.get_user_org_id() OR auth.uid() = user_id)
  WITH CHECK (organization_id = public.get_user_org_id() OR auth.uid() = user_id);

-- Keep public (anon) read for checkout
CREATE POLICY "shops_public_read"
  ON public.shops FOR SELECT TO anon
  USING (true);


-- ─── 2. Business info ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.business_info (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  legal_name        text NOT NULL DEFAULT '',
  tax_id            text NOT NULL DEFAULT '',
  address           text NOT NULL DEFAULT '',
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS business_info_org_id_idx ON public.business_info (organization_id);

ALTER TABLE public.business_info ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "business_info_select_org" ON public.business_info;
DROP POLICY IF EXISTS "business_info_insert_org" ON public.business_info;
DROP POLICY IF EXISTS "business_info_update_org" ON public.business_info;
DROP POLICY IF EXISTS "business_info_delete_org" ON public.business_info;

CREATE POLICY "business_info_select_org"
  ON public.business_info FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id());

CREATE POLICY "business_info_insert_org"
  ON public.business_info FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "business_info_update_org"
  ON public.business_info FOR UPDATE TO authenticated
  USING (organization_id = public.get_user_org_id())
  WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "business_info_delete_org"
  ON public.business_info FOR DELETE TO authenticated
  USING (organization_id = public.get_user_org_id());


-- ─── 3. Notifications ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  user_id           uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  type              text NOT NULL DEFAULT 'info',
  message           text NOT NULL DEFAULT '',
  read              boolean NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_org_id_idx ON public.notifications (organization_id);
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications (user_id);
CREATE INDEX IF NOT EXISTS notifications_read_idx ON public.notifications (read);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_org" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_org" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_org" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete_org" ON public.notifications;

CREATE POLICY "notifications_select_org"
  ON public.notifications FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id());

CREATE POLICY "notifications_insert_org"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "notifications_update_org"
  ON public.notifications FOR UPDATE TO authenticated
  USING (organization_id = public.get_user_org_id())
  WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "notifications_delete_org"
  ON public.notifications FOR DELETE TO authenticated
  USING (organization_id = public.get_user_org_id());


-- ─── 4. Subscriptions (simple plan tracking) ────────────────
-- NOTE: A richer organization_subscriptions table already exists.
-- This simpler table matches the settings-form subscription tab.
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  plan              text NOT NULL DEFAULT 'free',
  status            text NOT NULL DEFAULT 'active',
  start_date        timestamptz NOT NULL DEFAULT now(),
  end_date          timestamptz
);

CREATE INDEX IF NOT EXISTS subscriptions_org_id_idx ON public.subscriptions (organization_id);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subscriptions_select_org" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_insert_org" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_update_org" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_delete_org" ON public.subscriptions;

CREATE POLICY "subscriptions_select_org"
  ON public.subscriptions FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id());

CREATE POLICY "subscriptions_insert_org"
  ON public.subscriptions FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = public.get_user_org_id()
    AND public.get_user_org_role() = 'owner'
  );

CREATE POLICY "subscriptions_update_org"
  ON public.subscriptions FOR UPDATE TO authenticated
  USING (organization_id = public.get_user_org_id())
  WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "subscriptions_delete_org"
  ON public.subscriptions FOR DELETE TO authenticated
  USING (organization_id = public.get_user_org_id());


-- ─── 5. Danger zone: cascading deletes ──────────────────────
-- All related tables already reference organizations(id) ON DELETE CASCADE:
--   shops, business_info, notifications, subscriptions,
--   organization_members, organization_subscriptions,
--   organization_usage, organization_invitations
--
-- Organizations RLS already has "orgs_delete_self" policy for owner deletion.
-- The delete-account API uses admin.auth.admin.deleteUser() which cascades
-- to organization_members (ON DELETE CASCADE) and sets owner_id to NULL
-- (ON DELETE SET NULL).


-- ─── 6. Refresh schema cache ─────────────────────────────────
NOTIFY pgrst, 'reload schema';
