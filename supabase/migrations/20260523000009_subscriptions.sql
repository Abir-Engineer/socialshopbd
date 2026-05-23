-- ============================================================
-- Migration: SaaS Subscription System
-- Safe: additive only — adds columns, creates new tables
-- Compatible with existing RBAC and multi-tenant architecture
-- ============================================================

-- ─── 1. Extend Organizations table with subscription fields ───
ALTER TABLE public.organizations
  DROP CONSTRAINT IF EXISTS organizations_plan_check;

ALTER TABLE public.organizations
  ADD CONSTRAINT organizations_plan_check
  CHECK (plan IN ('free_trial', 'free', 'pro', 'enterprise'));

-- Migrate existing rows — 'free' becomes 'free_trial' for a grace period
UPDATE public.organizations
SET plan = 'free_trial'
WHERE plan = 'free';

-- Add subscription status
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS subscription_status text NOT NULL DEFAULT 'trialing'
    CHECK (subscription_status IN ('trialing', 'active', 'canceled', 'past_due', 'unpaid', 'incomplete'));

-- Add trial period tracking
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz NOT NULL DEFAULT (now() + INTERVAL '14 days');

-- Add payment provider columns (nullable — filled when payment happens)
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS stripe_customer_id       text UNIQUE;

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS stripe_subscription_id   text UNIQUE;

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS sslcommerz_tran_id       text;

-- Subscription period tracking
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS current_period_start timestamptz;

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS current_period_end   timestamptz;

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS billing_email        text;

-- Set existing organisations to free_trial with 14-day window from now
UPDATE public.organizations
SET
  subscription_status = 'trialing',
  trial_ends_at       = now() + INTERVAL '14 days',
  plan                = 'free_trial'
WHERE subscription_status = 'trialing' OR plan IS DISTINCT FROM 'pro';


-- ─── 2. Subscription history / billing events table ───────────
CREATE TABLE IF NOT EXISTS public.organization_subscriptions (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id      uuid        NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  plan                 text        NOT NULL CHECK (plan IN ('free_trial', 'free', 'pro', 'enterprise')),
  status               text        NOT NULL CHECK (status IN ('trialing', 'active', 'canceled', 'past_due', 'unpaid', 'incomplete')),
  payment_provider     text        NOT NULL DEFAULT 'none' CHECK (payment_provider IN ('stripe', 'sslcommerz', 'manual', 'none')),
  provider_subscription_id text,
  provider_customer_id     text,
  amount_bdt           integer,      -- Amount paid in BDT paisa (smallest unit)
  amount_usd           integer,      -- Amount paid in USD cents
  currency             text         DEFAULT 'BDT',
  billing_period       text         NOT NULL DEFAULT 'monthly' CHECK (billing_period IN ('monthly', 'yearly')),
  current_period_start timestamptz,
  current_period_end   timestamptz,
  canceled_at          timestamptz,
  trial_start          timestamptz,
  trial_end            timestamptz,
  metadata             jsonb        DEFAULT '{}',
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS org_subs_org_id_idx     ON public.organization_subscriptions (organization_id);
CREATE INDEX IF NOT EXISTS org_subs_status_idx     ON public.organization_subscriptions (status);
CREATE INDEX IF NOT EXISTS org_subs_provider_idx   ON public.organization_subscriptions (payment_provider, provider_subscription_id);

ALTER TABLE public.organization_subscriptions ENABLE ROW LEVEL SECURITY;


-- ─── 3. Usage tracking table ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.organization_usage (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid        NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE UNIQUE,
  orders_this_month integer     NOT NULL DEFAULT 0,
  usage_reset_at    timestamptz NOT NULL DEFAULT date_trunc('month', now()) + INTERVAL '1 month',
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS org_usage_org_id_idx ON public.organization_usage (organization_id);

ALTER TABLE public.organization_usage ENABLE ROW LEVEL SECURITY;


-- ─── 4. RLS for organization_subscriptions ────────────────────
DROP POLICY IF EXISTS "org_subs_select"  ON public.organization_subscriptions;
DROP POLICY IF EXISTS "org_subs_insert"  ON public.organization_subscriptions;
DROP POLICY IF EXISTS "org_subs_update"  ON public.organization_subscriptions;

CREATE POLICY "org_subs_select"
  ON public.organization_subscriptions FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id());

-- Insert/update only by service role (webhooks) or owner
CREATE POLICY "org_subs_insert"
  ON public.organization_subscriptions FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = public.get_user_org_id()
    AND public.get_user_org_role() = 'owner'
  );

CREATE POLICY "org_subs_update"
  ON public.organization_subscriptions FOR UPDATE TO authenticated
  USING (
    organization_id = public.get_user_org_id()
    AND public.get_user_org_role() = 'owner'
  )
  WITH CHECK (
    organization_id = public.get_user_org_id()
    AND public.get_user_org_role() = 'owner'
  );


-- ─── 5. RLS for organization_usage ────────────────────────────
DROP POLICY IF EXISTS "org_usage_select"  ON public.organization_usage;
DROP POLICY IF EXISTS "org_usage_insert"  ON public.organization_usage;
DROP POLICY IF EXISTS "org_usage_update"  ON public.organization_usage;

CREATE POLICY "org_usage_select"
  ON public.organization_usage FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id());

CREATE POLICY "org_usage_insert"
  ON public.organization_usage FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "org_usage_update"
  ON public.organization_usage FOR UPDATE TO authenticated
  USING (organization_id = public.get_user_org_id())
  WITH CHECK (organization_id = public.get_user_org_id());


-- ─── 6. Helper: get full subscription context for current org ──
CREATE OR REPLACE FUNCTION public.get_org_subscription_context(org_id uuid)
RETURNS TABLE (
  plan                 text,
  subscription_status  text,
  trial_ends_at        timestamptz,
  current_period_end   timestamptz,
  stripe_customer_id   text,
  orders_count         bigint,
  products_count       bigint,
  customers_count      bigint,
  staff_count          bigint,
  orders_this_month    integer
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Security check: caller must be a member of the requested org
  IF NOT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_members.organization_id = org_id
      AND organization_members.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    o.plan,
    o.subscription_status,
    o.trial_ends_at,
    o.current_period_end,
    o.stripe_customer_id,
    (SELECT COUNT(*) FROM public.orders    WHERE organization_id = org_id)::bigint,
    (SELECT COUNT(*) FROM public.products  WHERE organization_id = org_id)::bigint,
    (SELECT COUNT(*) FROM public.customers WHERE organization_id = org_id)::bigint,
    (SELECT COUNT(*) FROM public.organization_members WHERE organization_members.organization_id = org_id)::bigint,
    COALESCE((SELECT ou.orders_this_month FROM public.organization_usage ou WHERE ou.organization_id = org_id), 0)
  FROM public.organizations o
  WHERE o.id = org_id;
END;
$$;


-- ─── 7. Helper: check feature access by plan ─────────────────
CREATE OR REPLACE FUNCTION public.check_plan_feature(p_plan text, p_feature text)
RETURNS boolean
LANGUAGE plpgsql IMMUTABLE
SET search_path = public
AS $$
BEGIN
  CASE p_feature
    WHEN 'courier_dispatch' THEN
      RETURN p_plan IN ('free_trial', 'pro', 'enterprise');
    WHEN 'advanced_analytics' THEN
      RETURN p_plan IN ('pro', 'enterprise');
    WHEN 'ai_features' THEN
      RETURN p_plan IN ('pro', 'enterprise');
    WHEN 'unlimited_orders' THEN
      RETURN p_plan IN ('free_trial', 'pro', 'enterprise');
    WHEN 'unlimited_products' THEN
      RETURN p_plan IN ('free_trial', 'pro', 'enterprise');
    WHEN 'unlimited_customers' THEN
      RETURN p_plan IN ('free_trial', 'pro', 'enterprise');
    WHEN 'multi_staff' THEN
      RETURN p_plan IN ('pro', 'enterprise');
    ELSE
      RETURN TRUE; -- Unknown feature: allow by default
  END CASE;
END;
$$;


-- ─── 8. Auto-increment orders_this_month on order insert ──────
CREATE OR REPLACE FUNCTION public.increment_org_order_usage()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Upsert usage record for the org
  INSERT INTO public.organization_usage (organization_id, orders_this_month, usage_reset_at)
  VALUES (NEW.organization_id, 1, date_trunc('month', now()) + INTERVAL '1 month')
  ON CONFLICT (organization_id) DO UPDATE
  SET
    orders_this_month = CASE
      WHEN public.organization_usage.usage_reset_at <= now() THEN 1
      ELSE public.organization_usage.orders_this_month + 1
    END,
    usage_reset_at = CASE
      WHEN public.organization_usage.usage_reset_at <= now()
        THEN date_trunc('month', now()) + INTERVAL '1 month'
      ELSE public.organization_usage.usage_reset_at
    END,
    updated_at = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_increment_order_usage ON public.orders;
CREATE TRIGGER trg_increment_order_usage
  AFTER INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.increment_org_order_usage();


-- ─── 9. Index for fast Stripe webhook lookups ─────────────────
CREATE INDEX IF NOT EXISTS orgs_stripe_customer_idx      ON public.organizations (stripe_customer_id)      WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS orgs_stripe_subscription_idx  ON public.organizations (stripe_subscription_id)  WHERE stripe_subscription_id IS NOT NULL;
