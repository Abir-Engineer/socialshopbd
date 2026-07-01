-- Sprint 9: Settings Module Upgrade
-- 1. Add theme + locale to organizations
-- 2. Add invoice_prefix + default_courier to shops
-- 3. Create org_settings table (key-value JSON)
-- 4. Create notification_preferences table
-- 5. RLS policies

-- === 1. Organizations: theme + locale ===
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS theme  text NOT NULL DEFAULT 'light'
  CHECK (theme IN ('light', 'dark', 'system')),
ADD COLUMN IF NOT EXISTS locale text NOT NULL DEFAULT 'bn'
  CHECK (locale IN ('en', 'bn'));

-- === 2. Shops: invoice + courier columns ===
ALTER TABLE public.shops
ADD COLUMN IF NOT EXISTS invoice_prefix   text NOT NULL DEFAULT 'INV',
ADD COLUMN IF NOT EXISTS default_courier  text;

-- === 3. org_settings table ===
CREATE TABLE IF NOT EXISTS public.org_settings (
  id              uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid         NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  key             text         NOT NULL,
  value           jsonb        NOT NULL DEFAULT '{}',
  updated_at      timestamptz  NOT NULL DEFAULT now(),
  created_at      timestamptz  NOT NULL DEFAULT now(),
  CONSTRAINT org_settings_org_key UNIQUE (organization_id, key)
);

CREATE INDEX IF NOT EXISTS org_settings_org_idx ON public.org_settings (organization_id);

ALTER TABLE public.org_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_settings_org_select" ON public.org_settings
  FOR SELECT USING (organization_id = get_current_organization_id());

CREATE POLICY "org_settings_org_insert" ON public.org_settings
  FOR INSERT WITH CHECK (organization_id = get_current_organization_id());

CREATE POLICY "org_settings_org_update" ON public.org_settings
  FOR UPDATE USING (organization_id = get_current_organization_id());

CREATE POLICY "org_settings_org_delete" ON public.org_settings
  FOR DELETE USING (organization_id = get_current_organization_id());

-- === 4. notification_preferences table ===
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id                  uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     uuid         NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  email_enabled       boolean      NOT NULL DEFAULT true,
  sms_enabled         boolean      NOT NULL DEFAULT false,
  push_enabled        boolean      NOT NULL DEFAULT true,
  order_updates       boolean      NOT NULL DEFAULT true,
  low_stock_alerts    boolean      NOT NULL DEFAULT true,
  marketing_emails    boolean      NOT NULL DEFAULT false,
  payment_confirmations boolean   NOT NULL DEFAULT true,
  daily_summary       boolean      NOT NULL DEFAULT false,
  updated_at          timestamptz  NOT NULL DEFAULT now(),
  created_at          timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notif_prefs_org_idx ON public.notification_preferences (organization_id);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notif_prefs_org_select" ON public.notification_preferences
  FOR SELECT USING (organization_id = get_current_organization_id());

CREATE POLICY "notif_prefs_org_insert" ON public.notification_preferences
  FOR INSERT WITH CHECK (organization_id = get_current_organization_id());

CREATE POLICY "notif_prefs_org_update" ON public.notification_preferences
  FOR UPDATE USING (organization_id = get_current_organization_id());

CREATE POLICY "notif_prefs_org_delete" ON public.notification_preferences
  FOR DELETE USING (organization_id = get_current_organization_id());
