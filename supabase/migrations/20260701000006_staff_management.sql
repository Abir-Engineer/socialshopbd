-- Sprint 8: Staff Management Upgrade
-- 1. Add status + last_login to organization_members
-- 2. Create audit_logs table (who did what, when)
-- 3. Create activity_logs table (user activity timeline)
-- 4. Update get_organization_members RPC to include new columns

-- === 1. organization_members enhancements ===
ALTER TABLE public.organization_members
ADD COLUMN IF NOT EXISTS status     text NOT NULL DEFAULT 'active'
  CHECK (status IN ('active', 'inactive', 'suspended')),
ADD COLUMN IF NOT EXISTS last_login timestamptz;

CREATE INDEX IF NOT EXISTS org_members_status_idx ON public.organization_members (status);

-- === 2. audit_logs table ===
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid        NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  actor_id        uuid        NOT NULL REFERENCES auth.users       (id) ON DELETE CASCADE,
  action          text        NOT NULL CHECK (action IN (
    'member.invite',  'member.role_change', 'member.remove', 'member.suspend', 'member.activate',
    'invitation.cancel',
    'order.create',  'order.update',  'order.delete',  'order.status_change',
    'product.create','product.update','product.delete',
    'customer.create','customer.update','customer.delete',
    'settings.update',
    'subscription.change'
  )),
  target_type     text        NOT NULL,
  target_id       text        NOT NULL,
  details         jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_org_idx    ON public.audit_logs (organization_id);
CREATE INDEX IF NOT EXISTS audit_actor_idx  ON public.audit_logs (actor_id);
CREATE INDEX IF NOT EXISTS audit_action_idx ON public.audit_logs (action);
CREATE INDEX IF NOT EXISTS audit_date_idx   ON public.audit_logs (created_at DESC);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_org_select" ON public.audit_logs
  FOR SELECT USING (organization_id = public.get_user_org_id());

CREATE POLICY "audit_org_insert" ON public.audit_logs
  FOR INSERT WITH CHECK (organization_id = public.get_user_org_id());

-- === 3. activity_logs table ===
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid        NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  user_id         uuid        NOT NULL REFERENCES auth.users       (id) ON DELETE CASCADE,
  activity_type   text        NOT NULL CHECK (activity_type IN (
    'login', 'logout', 'viewed', 'created', 'updated', 'deleted', 'exported', 'imported', 'generated'
  )),
  description     text        NOT NULL,
  metadata        jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS activity_org_idx    ON public.activity_logs (organization_id);
CREATE INDEX IF NOT EXISTS activity_user_idx   ON public.activity_logs (user_id);
CREATE INDEX IF NOT EXISTS activity_type_idx   ON public.activity_logs (activity_type);
CREATE INDEX IF NOT EXISTS activity_date_idx   ON public.activity_logs (created_at DESC);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activity_org_select" ON public.activity_logs
  FOR SELECT USING (organization_id = public.get_user_org_id());

CREATE POLICY "activity_org_insert" ON public.activity_logs
  FOR INSERT WITH CHECK (organization_id = public.get_user_org_id());

-- === 4. Update get_organization_members RPC ===
CREATE OR REPLACE FUNCTION public.get_organization_members(org_id uuid)
RETURNS TABLE (
  id         uuid,
  user_id    uuid,
  role       text,
  created_at timestamptz,
  email      text,
  full_name  text,
  status     text,
  last_login timestamptz
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
    coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1))::text AS full_name,
    m.status,
    m.last_login
  FROM public.organization_members m
  JOIN auth.users u ON m.user_id = u.id
  WHERE m.organization_id = org_id;
END;
$$;
