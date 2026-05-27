-- ============================================================
-- Migration: Fix organizations + organization_members RLS
-- Fixes "new row violates row-level security policy" on onboarding
-- ============================================================

-- ─── 1. Add owner_id to organizations if not exists ──────────
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS organizations_owner_id_idx ON public.organizations (owner_id);

-- Backfill owner_id from existing owner memberships
UPDATE public.organizations o
SET owner_id = m.user_id
FROM public.organization_members m
WHERE m.organization_id = o.id
  AND m.role = 'owner'
  AND o.owner_id IS NULL;

-- ─── 2. RLS on organizations ─────────────────────────────────
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "orgs_insert_owner"          ON public.organizations;
DROP POLICY IF EXISTS "orgs_insert_self"           ON public.organizations;
DROP POLICY IF EXISTS "Allow all authenticated inserts" ON public.organizations;
DROP POLICY IF EXISTS "orgs_member_select"         ON public.organizations;
DROP POLICY IF EXISTS "orgs_member_update"         ON public.organizations;
DROP POLICY IF EXISTS "orgs_select_owner"          ON public.organizations;
DROP POLICY IF EXISTS "orgs_select_self"           ON public.organizations;
DROP POLICY IF EXISTS "orgs_update_owner"          ON public.organizations;
DROP POLICY IF EXISTS "orgs_update_self"           ON public.organizations;
DROP POLICY IF EXISTS "orgs_delete_owner"          ON public.organizations;
DROP POLICY IF EXISTS "orgs_delete_self"           ON public.organizations;

CREATE POLICY "orgs_insert_self"
  ON public.organizations FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "orgs_select_self"
  ON public.organizations FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "orgs_update_self"
  ON public.organizations FOR UPDATE TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "orgs_delete_self"
  ON public.organizations FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

-- ─── 3. RLS on organization_members ──────────────────────────
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "org_members_select"    ON public.organization_members;
DROP POLICY IF EXISTS "org_members_insert"    ON public.organization_members;
DROP POLICY IF EXISTS "org_members_update"    ON public.organization_members;
DROP POLICY IF EXISTS "org_members_delete"    ON public.organization_members;
DROP POLICY IF EXISTS "org_members_insert_self" ON public.organization_members;

-- Select: members can see their own org's members
CREATE POLICY "org_members_select"
  ON public.organization_members FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id());

-- Insert: owner/admin can add others; any user with NO membership can join as owner
CREATE POLICY "org_members_insert"
  ON public.organization_members FOR INSERT TO authenticated
  WITH CHECK (
    (organization_id = public.get_user_org_id() AND public.get_user_org_role() IN ('owner', 'admin'))
    OR
    (user_id = auth.uid() AND role = 'owner' AND NOT EXISTS (
      SELECT 1 FROM public.organization_members WHERE user_id = auth.uid()
    ))
  );

-- Update/Delete: owner/admin can manage
CREATE POLICY "org_members_update"
  ON public.organization_members FOR UPDATE TO authenticated
  USING (
    organization_id = public.get_user_org_id()
    AND public.get_user_org_role() IN ('owner', 'admin')
  )
  WITH CHECK (
    organization_id = public.get_user_org_id()
    AND public.get_user_org_role() IN ('owner', 'admin')
  );

CREATE POLICY "org_members_delete"
  ON public.organization_members FOR DELETE TO authenticated
  USING (
    organization_id = public.get_user_org_id()
    AND public.get_user_org_role() IN ('owner', 'admin')
  );

-- ─── 4. Update auth trigger to set owner_id on new signups ──
CREATE OR REPLACE FUNCTION public.handle_new_user_organization()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id uuid;
  org_name   text;
  org_slug   text;
  pending_invite record;
BEGIN
  SELECT * INTO pending_invite
  FROM public.organization_invitations
  WHERE email = new.email AND status = 'pending' AND expires_at > now()
  LIMIT 1;

  IF pending_invite.id IS NOT NULL THEN
    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (pending_invite.organization_id, new.id, pending_invite.role);

    UPDATE public.organization_invitations
    SET status = 'accepted'
    WHERE id = pending_invite.id;

    RETURN new;
  END IF;

  org_name := coalesce(split_part(new.email, '@', 1), 'My Business');
  org_slug := 'org-' || substr(new.id::text, 1, 8);

  WHILE EXISTS (SELECT 1 FROM public.organizations WHERE slug = org_slug) LOOP
    org_slug := 'org-' || substr(gen_random_uuid()::text, 1, 8);
  END LOOP;

  INSERT INTO public.organizations (name, slug, owner_id)
  VALUES (org_name, org_slug, new.id)
  RETURNING id INTO new_org_id;

  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (new_org_id, new.id, 'owner');

  RETURN new;
END;
$$;
