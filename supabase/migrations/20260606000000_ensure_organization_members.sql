-- ============================================================
-- Migration: Ensure organization_members table exists
-- Safely creates the table if missing, with RLS + policies.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.organization_members (
  id               uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid    NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  user_id          uuid    NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  role             text    NOT NULL DEFAULT 'viewer'
                CHECK (role IN ('owner', 'admin', 'manager', 'staff', 'viewer')),
  created_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT organization_members_unique UNIQUE (organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS org_members_user_id_idx ON public.organization_members (user_id);
CREATE INDEX IF NOT EXISTS org_members_org_id_idx  ON public.organization_members (organization_id);

ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- RLS policies
DROP POLICY IF EXISTS "org_members_select" ON public.organization_members;
DROP POLICY IF EXISTS "org_members_insert" ON public.organization_members;
DROP POLICY IF EXISTS "org_members_update" ON public.organization_members;
DROP POLICY IF EXISTS "org_members_delete" ON public.organization_members;

CREATE POLICY "org_members_select"
  ON public.organization_members FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id());

CREATE POLICY "org_members_insert"
  ON public.organization_members FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = public.get_user_org_id()
    AND public.get_user_org_role() IN ('owner', 'admin')
  );

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

-- Security definer helper: get active organization members with email and name
CREATE OR REPLACE FUNCTION public.get_organization_members(org_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  role text,
  created_at timestamptz,
  email text,
  full_name text
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_members.organization_id = org_id
    AND organization_members.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    m.id,
    m.user_id,
    m.role,
    m.created_at,
    u.email::text,
    coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1))::text AS full_name
  FROM public.organization_members m
  JOIN auth.users u ON m.user_id = u.id
  WHERE m.organization_id = org_id;
END;
$$;
