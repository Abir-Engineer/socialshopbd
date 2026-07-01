"use client";

import { useEffect, useState, useId } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { fetchShop, fetchOrgSetting, fetchNotificationPrefs } from "@/lib/settings/service";
import { BusinessInfoSection } from "./business-info-section";
import { BusinessLogoSection } from "./business-logo-section";
import { InvoiceSection } from "./invoice-section";
import { CourierSection } from "./courier-section";
import { ThemeSection } from "./theme-section";
import { TaxSection } from "./tax-section";
import { BackupSection } from "./backup-section";
import { NotificationSection } from "./notification-section";
import { SecuritySection } from "./security-section";
import { SubscriptionSection } from "./subscription-section";
import { DangerSection } from "./danger-section";
import type { Theme, Locale, InvoiceSettings, CourierSettings, TaxSettings, BackupSettings, NotificationPrefs } from "@/types/settings";
import {
  DEFAULT_INVOICE_SETTINGS, DEFAULT_COURIER_SETTINGS, DEFAULT_TAX_SETTINGS,
  DEFAULT_BACKUP_SETTINGS, DEFAULT_NOTIFICATION_PREFS,
} from "@/types/settings";
import {
  Store, FileText, Truck, Palette, Percent, Download, Bell, Key, Crown, AlertTriangle, Image, Globe,
} from "lucide-react";

interface TabDef {
  key: string;
  label: string;
  icon: typeof Store;
  adminOnly?: boolean;
}

const TABS: TabDef[] = [
  { key: "business-info",   label: "Business Information", icon: Store },
  { key: "business-logo",   label: "Business Logo",       icon: Image },
  { key: "invoice",         label: "Invoice Settings",     icon: FileText },
  { key: "courier",         label: "Courier Settings",     icon: Truck },
  { key: "theme",           label: "Theme & Language",     icon: Palette },
  { key: "tax",             label: "Taxes",                icon: Percent },
  { key: "backup",          label: "Backup & Export",      icon: Download },
  { key: "notifications",   label: "Notifications",        icon: Bell },
  { key: "security",        label: "Security",             icon: Key },
  { key: "subscription",    label: "Subscription",         icon: Crown, adminOnly: true },
  { key: "danger",          label: "Danger Zone",          icon: AlertTriangle, adminOnly: true },
];

export function SettingsShell() {
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("business-info");
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Shop data
  const [shopData, setShopData] = useState<{
    shop_name: string;
    logo_url: string | null;
    invoice_prefix: string;
    default_courier: string | null;
  } | null>(null);

  // Business info
  const [businessInfo, setBusinessInfo] = useState({
    legal_name: "", tax_id: "", address: "", owner_name: "", business_type: "", website: "", facebook: "",
  });

  // Settings from org_settings
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettings>(DEFAULT_INVOICE_SETTINGS);
  const [courierSettings, setCourierSettings] = useState<CourierSettings>(DEFAULT_COURIER_SETTINGS);
  const [taxSettings, setTaxSettings] = useState<TaxSettings>(DEFAULT_TAX_SETTINGS);
  const [backupSettings, setBackupSettings] = useState<BackupSettings>(DEFAULT_BACKUP_SETTINGS);
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPrefs>(DEFAULT_NOTIFICATION_PREFS);

  // Org-level
  const [orgTheme, setOrgTheme] = useState<Theme>("light");
  const [orgLocale, setOrgLocale] = useState<Locale>("bn");

  // Subscription
  const [currentPlan, setCurrentPlan] = useState("Starter");
  const [currentExpiry, setCurrentExpiry] = useState("");

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let cancelled = false;

    async function load() {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u || cancelled) { setLoading(false); return; }
      setUser({ id: u.id, email: u.email });

      const metadata = (u.user_metadata ?? {}) as Record<string, unknown>;
      setCurrentPlan((metadata.subscriptionPlan as string) || "Starter");
      setCurrentExpiry((metadata.subscriptionExpiry as string) || "");

      // Get org ID and role
      const { data: membership } = await supabase
        .from("organization_members")
        .select("organization_id, role")
        .eq("user_id", u.id)
        .limit(1)
        .maybeSingle();

      if (!membership || cancelled) { setLoading(false); return; }
      setOrgId(membership.organization_id);
      setUserRole(membership.role);

      // Parallel fetches
      const [shopResult, bizResult, orgResult, notifPrefs] = await Promise.all([
        fetchShop(supabase, u.id),
        supabase.from("business_info").select("*").eq("organization_id", membership.organization_id).maybeSingle(),
        supabase.from("organizations").select("theme, locale").eq("id", membership.organization_id).single(),
        fetchNotificationPrefs(supabase, membership.organization_id),
      ]);

      if (cancelled) return;

      // Shop
      if (shopResult) {
        setShopData({
          shop_name: (shopResult.shop_name as string) ?? "",
          logo_url: (shopResult.logo_url as string) ?? null,
          invoice_prefix: (shopResult.invoice_prefix as string) ?? "INV",
          default_courier: (shopResult.default_courier as string) ?? null,
        });
      }

      // Business info
      if (bizResult.data) {
        setBusinessInfo({
          legal_name: (bizResult.data as Record<string, string>).legal_name ?? "",
          tax_id: (bizResult.data as Record<string, string>).tax_id ?? "",
          address: (bizResult.data as Record<string, string>).address ?? "",
          owner_name: businessInfo.owner_name,
          business_type: businessInfo.business_type,
          website: businessInfo.website,
          facebook: businessInfo.facebook,
        });
      }

      // Org theme + locale
      if (orgResult.data) {
        setOrgTheme((orgResult.data.theme as Theme) || "light");
        setOrgLocale((orgResult.data.locale as Locale) || "bn");
      }

      // Notification prefs
      if (notifPrefs) {
        const n = notifPrefs as Record<string, unknown>;
        setNotificationPrefs({
          email_enabled: (n.email_enabled as boolean) ?? true,
          sms_enabled: (n.sms_enabled as boolean) ?? false,
          push_enabled: (n.push_enabled as boolean) ?? true,
          order_updates: (n.order_updates as boolean) ?? true,
          low_stock_alerts: (n.low_stock_alerts as boolean) ?? true,
          marketing_emails: (n.marketing_emails as boolean) ?? false,
          payment_confirmations: (n.payment_confirmations as boolean) ?? true,
          daily_summary: (n.daily_summary as boolean) ?? false,
        });
      }

      // Load org_settings (invoice, courier, tax, backup)
      const [invVal, courVal, taxVal, backupVal] = await Promise.all([
        fetchOrgSetting(supabase, membership.organization_id, "invoice"),
        fetchOrgSetting(supabase, membership.organization_id, "courier"),
        fetchOrgSetting(supabase, membership.organization_id, "tax"),
        fetchOrgSetting(supabase, membership.organization_id, "backup"),
      ]);

      if (!cancelled) {
        if (invVal && typeof invVal === "object") setInvoiceSettings({ ...DEFAULT_INVOICE_SETTINGS, ...(invVal as unknown as InvoiceSettings) });
        if (courVal && typeof courVal === "object") setCourierSettings({ ...DEFAULT_COURIER_SETTINGS, ...(courVal as unknown as CourierSettings) });
        if (taxVal && typeof taxVal === "object") setTaxSettings({ ...DEFAULT_TAX_SETTINGS, ...(taxVal as unknown as TaxSettings) });
        if (backupVal && typeof backupVal === "object") setBackupSettings({ ...DEFAULT_BACKUP_SETTINGS, ...(backupVal as unknown as BackupSettings) });
      }

      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="grid gap-6 xl:grid-cols-[240px_1fr]">
        <div className="h-96 animate-pulse rounded-xl bg-muted" />
        <div className="h-96 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  const filteredTabs = TABS.filter((t) => {
    if (t.adminOnly && userRole !== "owner") return false;
    return true;
  });

  const renderSection = () => {
    if (!orgId || !user) return null;

    switch (tab) {
      case "business-info":
        return <BusinessInfoSection orgId={orgId} initial={businessInfo} />;
      case "business-logo":
        return <BusinessLogoSection userId={user.id} initialLogoUrl={shopData?.logo_url ?? null} initialShopName={shopData?.shop_name ?? ""} />;
      case "invoice":
        return <InvoiceSection orgId={orgId} userId={user.id} initial={invoiceSettings} />;
      case "courier":
        return <CourierSection orgId={orgId} userId={user.id} initial={courierSettings} />;
      case "theme":
        return <ThemeSection orgId={orgId} initialTheme={orgTheme} initialLocale={orgLocale} />;
      case "tax":
        return <TaxSection orgId={orgId} initial={taxSettings} />;
      case "backup":
        return <BackupSection orgId={orgId} initial={backupSettings} />;
      case "notifications":
        return <NotificationSection orgId={orgId} initial={notificationPrefs} />;
      case "security":
        return <SecuritySection />;
      case "subscription":
        return <SubscriptionSection currentPlan={currentPlan} currentExpiry={currentExpiry} userId={user.id} />;
      case "danger":
        return <DangerSection />;
      default:
        return <BusinessInfoSection orgId={orgId} initial={businessInfo} />;
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[240px_1fr]">
      {/* Sidebar */}
      <aside className="space-y-1 rounded-xl border border-border bg-card p-3 shadow-sm h-fit">
        <p className="px-3 pb-2 text-xs uppercase tracking-widest text-muted-foreground font-semibold">
          Settings
        </p>
        <nav className="space-y-0.5">
          {filteredTabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition cursor-pointer ${
                  tab === t.key
                    ? "bg-blue-600 text-white"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{t.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Content */}
      <main className="space-y-6">
        {renderSection()}
      </main>
    </div>
  );
}
