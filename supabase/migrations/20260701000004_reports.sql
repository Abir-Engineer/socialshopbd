-- Sprint 6: Reports & Analytics Upgrade
-- 1. Add shipping_cost_bdt (actual courier cost) to orders
-- 2. Create expenses table

-- Shipping cost (what we pay the courier, distinct from delivery_charge_bdt which customer pays)
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS shipping_cost_bdt integer NOT NULL DEFAULT 0;

-- Expenses table for overhead tracking
CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  amount_bdt integer NOT NULL CHECK (amount_bdt >= 0),
  category text NOT NULL,
  description text,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS expenses_org_date_idx  ON public.expenses (organization_id, date);
CREATE INDEX IF NOT EXISTS expenses_category_idx  ON public.expenses (category);

-- RLS for expenses
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expenses_org_select" ON public.expenses
  FOR SELECT USING (organization_id = get_current_organization_id());

CREATE POLICY "expenses_org_insert" ON public.expenses
  FOR INSERT WITH CHECK (organization_id = get_current_organization_id());

CREATE POLICY "expenses_org_update" ON public.expenses
  FOR UPDATE USING (organization_id = get_current_organization_id());

CREATE POLICY "expenses_org_delete" ON public.expenses
  FOR DELETE USING (organization_id = get_current_organization_id());
