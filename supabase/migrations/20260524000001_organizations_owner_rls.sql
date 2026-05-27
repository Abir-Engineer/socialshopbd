-- ============================================================
-- Migration: Add owner_id to organizations + direct RLS policies
-- Enables simpler RLS: auth.uid() = owner_id
-- ============================================================

-- ─── 1. Add owner_id column ──────────────────────────────────
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS organizations_owner_id_idx ON public.organizations (owner_id);

-- ─── 2. Backfill owner_id from organization_members ──────────
UPDATE public.organizations o
SET owner_id = m.user_id
FROM public.organization_members m
WHERE m.organization_id = o.id
  AND m.role = 'owner'
  AND o.owner_id IS NULL;

-- ─── 3. RLS: ensure enabled ──────────────────────────────────
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- ─── 4. Insert policy: authenticated users can insert with auth.uid() = owner_id
DROP POLICY IF EXISTS "orgs_insert_owner" ON public.organizations;
CREATE POLICY "orgs_insert_owner"
  ON public.organizations FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- ─── 5. Select policy: authenticated users can read their own rows
DROP POLICY IF EXISTS "orgs_select_owner" ON public.organizations;
CREATE POLICY "orgs_select_owner"
  ON public.organizations FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

-- ─── 6. Update policy: owner can update their own org
DROP POLICY IF EXISTS "orgs_update_owner" ON public.organizations;
CREATE POLICY "orgs_update_owner"
  ON public.organizations FOR UPDATE TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- ─── 7. Delete policy: owner can delete their own org
DROP POLICY IF EXISTS "orgs_delete_owner" ON public.organizations;
CREATE POLICY "orgs_delete_owner"
  ON public.organizations FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

-- ─── 8. Update auth trigger to set owner_id on new signups ──
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
  -- Check if there is an active pending invitation for this email address
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
