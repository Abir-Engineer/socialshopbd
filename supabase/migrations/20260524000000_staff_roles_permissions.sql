-- ============================================================
-- Migration: Staff Roles & Permissions System
-- Adds 'manager' role, staff_members table, and route-level RBAC
-- ============================================================

-- ─── 1. Add 'manager' to organization_members role check ──────
ALTER TABLE public.organization_members DROP CONSTRAINT IF EXISTS organization_members_role_check;
ALTER TABLE public.organization_members ADD CONSTRAINT organization_members_role_check
  CHECK (role IN ('owner', 'admin', 'manager', 'staff', 'viewer'));

-- ─── 2. Update organization_invitations role check ────────────
ALTER TABLE public.organization_invitations DROP CONSTRAINT IF EXISTS organization_invitations_role_check;
ALTER TABLE public.organization_invitations ADD CONSTRAINT organization_invitations_role_check
  CHECK (role IN ('admin', 'manager', 'staff', 'viewer'));

-- ─── 3. Create staff_members table ────────────────────────────
CREATE TABLE IF NOT EXISTS public.staff_members (
  id              uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_owner_id   uuid    NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name       text    NOT NULL,
  email           text    NOT NULL,
  role            text    NOT NULL CHECK (role IN ('admin', 'manager', 'staff')),
  status          text    NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS staff_members_email_idx ON public.staff_members (email);
CREATE INDEX IF NOT EXISTS staff_members_owner_idx ON public.staff_members (shop_owner_id);

ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;

-- ─── 4. RLS policies for staff_members ────────────────────────
CREATE POLICY "staff_members_select_own"
  ON public.staff_members FOR SELECT TO authenticated
  USING (shop_owner_id = auth.uid());

CREATE POLICY "staff_members_insert_own"
  ON public.staff_members FOR INSERT TO authenticated
  WITH CHECK (shop_owner_id = auth.uid());

CREATE POLICY "staff_members_update_own"
  ON public.staff_members FOR UPDATE TO authenticated
  USING (shop_owner_id = auth.uid())
  WITH CHECK (shop_owner_id = auth.uid());

CREATE POLICY "staff_members_delete_own"
  ON public.staff_members FOR DELETE TO authenticated
  USING (shop_owner_id = auth.uid());

-- ─── 5. Update get_user_org_role to include manager ───────────
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

-- ─── 6. Update RLS policies to allow manager access ───────────
-- Orders: admins, managers, staff all get CRUD access
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
    AND public.get_user_org_role() IN ('owner', 'admin', 'manager', 'staff')
  );

CREATE POLICY "orders_update_org"
  ON public.orders FOR UPDATE TO authenticated
  USING (
    organization_id = public.get_user_org_id() 
    AND public.get_user_org_role() IN ('owner', 'admin', 'manager', 'staff')
  )
  WITH CHECK (
    organization_id = public.get_user_org_id() 
    AND public.get_user_org_role() IN ('owner', 'admin', 'manager', 'staff')
  );

CREATE POLICY "orders_delete_org"
  ON public.orders FOR DELETE TO authenticated
  USING (
    organization_id = public.get_user_org_id() 
    AND public.get_user_org_role() IN ('owner', 'admin', 'manager', 'staff')
  );

-- Customers: admins, managers, staff all get CRUD access
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
    AND public.get_user_org_role() IN ('owner', 'admin', 'manager', 'staff')
  );

CREATE POLICY "customers_update_org"
  ON public.customers FOR UPDATE TO authenticated
  USING (
    organization_id = public.get_user_org_id() 
    AND public.get_user_org_role() IN ('owner', 'admin', 'manager', 'staff')
  )
  WITH CHECK (
    organization_id = public.get_user_org_id() 
    AND public.get_user_org_role() IN ('owner', 'admin', 'manager', 'staff')
  );

CREATE POLICY "customers_delete_org"
  ON public.customers FOR DELETE TO authenticated
  USING (
    organization_id = public.get_user_org_id() 
    AND public.get_user_org_role() IN ('owner', 'admin', 'manager', 'staff')
  );

-- Update get_organization_members to include manager role
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

-- ─── 7. Updated RLS policies for staff_members ────────────────
-- Products: admins, managers, staff all get CRUD
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
    AND public.get_user_org_role() IN ('owner', 'admin', 'manager', 'staff')
  );

CREATE POLICY "products_update_org"
  ON public.products FOR UPDATE TO authenticated
  USING (
    organization_id = public.get_user_org_id() 
    AND public.get_user_org_role() IN ('owner', 'admin', 'manager', 'staff')
  )
  WITH CHECK (
    organization_id = public.get_user_org_id() 
    AND public.get_user_org_role() IN ('owner', 'admin', 'manager', 'staff')
  );

CREATE POLICY "products_delete_org"
  ON public.products FOR DELETE TO authenticated
  USING (
    organization_id = public.get_user_org_id() 
    AND public.get_user_org_role() IN ('owner', 'admin', 'manager', 'staff')
  );
