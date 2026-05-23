-- ============================================================
-- Migration: Complete Role-Based Access Control (RBAC) System
-- Safe: alters constraints, creates invitations, secures policies
-- ============================================================

-- ─── 1. Update organization_members role constraints ──────────
-- Standardize existing roles first to prevent violation
UPDATE public.organization_members 
SET role = 'staff' 
WHERE role = 'member';

-- Drop existing role constraint if it exists (usually organization_members_role_check)
ALTER TABLE public.organization_members DROP CONSTRAINT IF EXISTS organization_members_role_check;

-- Add updated check constraint allowing owner, admin, staff, viewer
ALTER TABLE public.organization_members ADD CONSTRAINT organization_members_role_check
  CHECK (role IN ('owner', 'admin', 'staff', 'viewer'));


-- ─── 2. Create organization invitations table ────────────────
CREATE TABLE IF NOT EXISTS public.organization_invitations (
  id               uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid    NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  email            text    NOT NULL,
  role             text    NOT NULL CHECK (role IN ('admin', 'staff', 'viewer')),
  invited_by       uuid    NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  token            uuid    NOT NULL DEFAULT gen_random_uuid(),
  created_at       timestamptz NOT NULL DEFAULT now(),
  expires_at       timestamptz NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  status           text    NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  CONSTRAINT organization_invitations_unique UNIQUE (organization_id, email)
);

CREATE INDEX IF NOT EXISTS org_invitations_token_idx ON public.organization_invitations (token);
CREATE INDEX IF NOT EXISTS org_invitations_email_idx ON public.organization_invitations (email);

ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;


-- ─── 3. Helper function: get current user's org role ──────────
CREATE OR REPLACE FUNCTION public.get_user_org_role()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM   public.organization_members
  WHERE  user_id = auth.uid()
  LIMIT  1;
$$;


-- ─── 4. Rebuild Security Policies for Organizations ───────────
DROP POLICY IF EXISTS "orgs_member_select" ON public.organizations;
DROP POLICY IF EXISTS "orgs_member_update" ON public.organizations;

CREATE POLICY "orgs_member_select"
  ON public.organizations FOR SELECT TO authenticated
  USING (id = public.get_user_org_id());

-- Only owner and admin roles can modify organization details
CREATE POLICY "orgs_member_update"
  ON public.organizations FOR UPDATE TO authenticated
  USING (id = public.get_user_org_id() AND public.get_user_org_role() IN ('owner', 'admin'))
  WITH CHECK (id = public.get_user_org_id() AND public.get_user_org_role() IN ('owner', 'admin'));


-- ─── 5. Rebuild Security Policies for Organization Members ───
DROP POLICY IF EXISTS "org_members_select" ON public.organization_members;
DROP POLICY IF EXISTS "org_members_insert" ON public.organization_members;
DROP POLICY IF EXISTS "org_members_update" ON public.organization_members;
DROP POLICY IF EXISTS "org_members_delete" ON public.organization_members;

CREATE POLICY "org_members_select"
  ON public.organization_members FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id());

-- Only owner and admin roles can manage members
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


-- ─── 6. Rebuild Security Policies for Invitations ─────────────
DROP POLICY IF EXISTS "org_invitations_select" ON public.organization_invitations;
DROP POLICY IF EXISTS "org_invitations_insert" ON public.organization_invitations;
DROP POLICY IF EXISTS "org_invitations_update" ON public.organization_invitations;
DROP POLICY IF EXISTS "org_invitations_delete" ON public.organization_invitations;
DROP POLICY IF EXISTS "org_invitations_public_select" ON public.organization_invitations;

CREATE POLICY "org_invitations_select"
  ON public.organization_invitations FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id());

-- Only owner and admin can manage invitations
CREATE POLICY "org_invitations_insert"
  ON public.organization_invitations FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = public.get_user_org_id()
    AND public.get_user_org_role() IN ('owner', 'admin')
  );

CREATE POLICY "org_invitations_update"
  ON public.organization_invitations FOR UPDATE TO authenticated
  USING (
    organization_id = public.get_user_org_id()
    AND public.get_user_org_role() IN ('owner', 'admin')
  )
  WITH CHECK (
    organization_id = public.get_user_org_id()
    AND public.get_user_org_role() IN ('owner', 'admin')
  );

CREATE POLICY "org_invitations_delete"
  ON public.organization_invitations FOR DELETE TO authenticated
  USING (
    organization_id = public.get_user_org_id()
    AND public.get_user_org_role() IN ('owner', 'admin')
  );

-- Public / Anonymous select policy for pending invitations by token
CREATE POLICY "org_invitations_public_select"
  ON public.organization_invitations FOR SELECT TO public
  USING (status = 'pending' AND expires_at > now());


-- ─── 7. Rebuild Security Policies for Products ────────────────
DROP POLICY IF EXISTS "products_select_org" ON public.products;
DROP POLICY IF EXISTS "products_insert_org" ON public.products;
DROP POLICY IF EXISTS "products_update_org" ON public.products;
DROP POLICY IF EXISTS "products_delete_org" ON public.products;

CREATE POLICY "products_select_org"
  ON public.products FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id());

CREATE POLICY "products_insert_org"
  ON public.products FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = public.get_user_org_id() 
    AND public.get_user_org_role() IN ('owner', 'admin', 'staff')
  );

CREATE POLICY "products_update_org"
  ON public.products FOR UPDATE TO authenticated
  USING (
    organization_id = public.get_user_org_id() 
    AND public.get_user_org_role() IN ('owner', 'admin', 'staff')
  )
  WITH CHECK (
    organization_id = public.get_user_org_id() 
    AND public.get_user_org_role() IN ('owner', 'admin', 'staff')
  );

CREATE POLICY "products_delete_org"
  ON public.products FOR DELETE TO authenticated
  USING (
    organization_id = public.get_user_org_id() 
    AND public.get_user_org_role() IN ('owner', 'admin', 'staff')
  );


-- ─── 8. Rebuild Security Policies for Orders ──────────────────
DROP POLICY IF EXISTS "orders_select_org" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_org" ON public.orders;
DROP POLICY IF EXISTS "orders_update_org" ON public.orders;
DROP POLICY IF EXISTS "orders_delete_org" ON public.orders;

CREATE POLICY "orders_select_org"
  ON public.orders FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id());

CREATE POLICY "orders_insert_org"
  ON public.orders FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = public.get_user_org_id() 
    AND public.get_user_org_role() IN ('owner', 'admin', 'staff')
  );

CREATE POLICY "orders_update_org"
  ON public.orders FOR UPDATE TO authenticated
  USING (
    organization_id = public.get_user_org_id() 
    AND public.get_user_org_role() IN ('owner', 'admin', 'staff')
  )
  WITH CHECK (
    organization_id = public.get_user_org_id() 
    AND public.get_user_org_role() IN ('owner', 'admin', 'staff')
  );

CREATE POLICY "orders_delete_org"
  ON public.orders FOR DELETE TO authenticated
  USING (
    organization_id = public.get_user_org_id() 
    AND public.get_user_org_role() IN ('owner', 'admin', 'staff')
  );


-- ─── 9. Rebuild Security Policies for Customers ───────────────
DROP POLICY IF EXISTS "customers_select_org" ON public.customers;
DROP POLICY IF EXISTS "customers_insert_org" ON public.customers;
DROP POLICY IF EXISTS "customers_update_org" ON public.customers;
DROP POLICY IF EXISTS "customers_delete_org" ON public.customers;

CREATE POLICY "customers_select_org"
  ON public.customers FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id());

CREATE POLICY "customers_insert_org"
  ON public.customers FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = public.get_user_org_id() 
    AND public.get_user_org_role() IN ('owner', 'admin', 'staff')
  );

CREATE POLICY "customers_update_org"
  ON public.customers FOR UPDATE TO authenticated
  USING (
    organization_id = public.get_user_org_id() 
    AND public.get_user_org_role() IN ('owner', 'admin', 'staff')
  )
  WITH CHECK (
    organization_id = public.get_user_org_id() 
    AND public.get_user_org_role() IN ('owner', 'admin', 'staff');
  );

CREATE POLICY "customers_delete_org"
  ON public.customers FOR DELETE TO authenticated
  USING (
    organization_id = public.get_user_org_id() 
    AND public.get_user_org_role() IN ('owner', 'admin', 'staff')
  );


-- ─── 10. Rebuild Security Policies for Order Items ─────────────
DROP POLICY IF EXISTS "order_items_select_org" ON public.order_items;
DROP POLICY IF EXISTS "order_items_insert_org" ON public.order_items;
DROP POLICY IF EXISTS "order_items_update_org" ON public.order_items;
DROP POLICY IF EXISTS "order_items_delete_org" ON public.order_items;

CREATE POLICY "order_items_select_org"
  ON public.order_items FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.orders o
    WHERE  o.id = order_items.order_id
    AND    o.organization_id = public.get_user_org_id()
  ));

CREATE POLICY "order_items_insert_org"
  ON public.order_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.orders o
    WHERE  o.id = order_items.order_id
    AND    o.organization_id = public.get_user_org_id()
    AND    public.get_user_org_role() IN ('owner', 'admin', 'staff')
  ));

CREATE POLICY "order_items_update_org"
  ON public.order_items FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.orders o
    WHERE  o.id = order_items.order_id
    AND    o.organization_id = public.get_user_org_id()
    AND    public.get_user_org_role() IN ('owner', 'admin', 'staff')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.orders o
    WHERE  o.id = order_items.order_id
    AND    o.organization_id = public.get_user_org_id()
    AND    public.get_user_org_role() IN ('owner', 'admin', 'staff')
  ));

CREATE POLICY "order_items_delete_org"
  ON public.order_items FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.orders o
    WHERE  o.id = order_items.order_id
    AND    o.organization_id = public.get_user_org_id()
    AND    public.get_user_org_role() IN ('owner', 'admin', 'staff')
  ));


-- ─── 11. Security Definer helper: get active organization members ───
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
  -- Security check: callers must be a member of the requested organization
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


-- ─── 12. Smart Auto-Link Pending Invitees Trigger On Signup ───
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
    -- Join their invited organization instead of creating a duplicate
    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (pending_invite.organization_id, new.id, pending_invite.role);

    -- Set status to accepted
    UPDATE public.organization_invitations
    SET status = 'accepted'
    WHERE id = pending_invite.id;
  ELSE
    -- Default onboarding path: create a brand new organization
    org_name := coalesce(split_part(new.email, '@', 1), 'My Business');
    org_slug  := 'org-' || substr(new.id::text, 1, 8);

    -- Ensure unique slug
    WHILE EXISTS (SELECT 1 FROM public.organizations WHERE slug = org_slug) LOOP
      org_slug := 'org-' || substr(gen_random_uuid()::text, 1, 8);
    END LOOP;

    INSERT INTO public.organizations (name, slug)
    VALUES (org_name, org_slug)
    RETURNING id into new_org_id;

    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (new_org_id, new.id, 'owner');
  END IF;

  RETURN new;
END;
$$;
