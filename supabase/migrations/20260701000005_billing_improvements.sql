-- Sprint 7: Billing Module Improvements
-- 1. Payment history table
-- 2. Coupons / promo codes table
-- 3. Additional columns for organization_subscriptions

-- Payment history
CREATE TABLE IF NOT EXISTS public.payment_history (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       uuid        NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  plan                  text        NOT NULL,
  amount_bdt            integer     NOT NULL CHECK (amount_bdt >= 0),
  currency              text        NOT NULL DEFAULT 'BDT',
  payment_provider      text        NOT NULL DEFAULT 'manual' CHECK (payment_provider IN ('stripe', 'sslcommerz', 'bkash', 'manual')),
  provider_payment_id   text,
  status                text        NOT NULL DEFAULT 'succeeded' CHECK (status IN ('succeeded', 'failed', 'refunded', 'pending')),
  invoice_number        text,
  invoice_pdf_url       text,
  period_start          timestamptz,
  period_end            timestamptz,
  paid_at               timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payhist_org_idx    ON public.payment_history (organization_id);
CREATE INDEX IF NOT EXISTS payhist_status_idx ON public.payment_history (status);
CREATE INDEX IF NOT EXISTS payhist_date_idx   ON public.payment_history (paid_at DESC NULLS LAST);

-- Coupons / promo codes
CREATE TABLE IF NOT EXISTS public.coupons (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       uuid        REFERENCES public.organizations (id) ON DELETE CASCADE,
  code                  text        NOT NULL,
  type                  text        NOT NULL CHECK (type IN ('percentage', 'fixed')) DEFAULT 'percentage',
  value                 integer     NOT NULL CHECK (value > 0),
  max_uses              integer     NOT NULL DEFAULT 1 CHECK (max_uses >= 1),
  current_uses          integer     NOT NULL DEFAULT 0 CHECK (current_uses >= 0),
  min_plan              text        CHECK (min_plan IN ('free', 'free_trial', 'pro', 'enterprise')),
  expires_at            date,
  is_active             boolean     NOT NULL DEFAULT true,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS coupons_code_org_uniq ON public.coupons (code, organization_id) WHERE organization_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS coupons_code_global   ON public.coupons (code)               WHERE organization_id IS NULL;
CREATE INDEX IF NOT EXISTS coupons_active_idx            ON public.coupons (is_active) WHERE is_active = true;

ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons          ENABLE ROW LEVEL SECURITY;

-- RLS for payment_history
CREATE POLICY "payhist_org_select" ON public.payment_history
  FOR SELECT USING (organization_id = get_current_organization_id());

CREATE POLICY "payhist_org_insert" ON public.payment_history
  FOR INSERT WITH CHECK (organization_id = get_current_organization_id());

-- RLS for coupons
CREATE POLICY "coupons_org_select" ON public.coupons
  FOR SELECT USING (organization_id IS NULL OR organization_id = get_current_organization_id());

-- Additional columns for organization_subscriptions
ALTER TABLE public.organization_subscriptions
ADD COLUMN IF NOT EXISTS coupon_code         text,
ADD COLUMN IF NOT EXISTS discount_amount_bdt integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS invoice_number      text,
ADD COLUMN IF NOT EXISTS invoice_pdf_url     text;
