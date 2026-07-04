"use client";

import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { upsertShop, upsertOrgSetting } from "@/lib/settings/service";
import { INVOICE_TEMPLATE_OPTIONS } from "@/lib/settings/display";
import type { InvoiceSettings } from "@/types/settings";
import { DEFAULT_INVOICE_SETTINGS } from "@/types/settings";
import { useToast } from "@/components/ui/toast";

interface Props {
  orgId: string;
  userId: string;
  initial: InvoiceSettings;
}

export function InvoiceSection({ orgId, userId, initial }: Props) {
  const [settings, setSettings] = useState<InvoiceSettings>({ ...DEFAULT_INVOICE_SETTINGS, ...initial });
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const update = <K extends keyof InvoiceSettings>(key: K, value: InvoiceSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    const supabase = getSupabaseBrowserClient();
    await upsertShop(supabase, userId, { invoice_prefix: settings.prefix });
    await upsertOrgSetting(supabase, orgId, "invoice", settings as never);
    setSaving(false);
    toast.success("Invoice settings have been saved successfully.");
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Invoice Settings</h2>
          <p className="text-sm text-muted-foreground">Configure invoice numbering, template, and terms.</p>
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition cursor-pointer"
        >
          {saving ? "Saving..." : "Save Invoice Settings"}
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Invoice prefix</label>
          <input
            value={settings.prefix}
            onChange={(e) => update("prefix", e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Template</label>
          <select
            value={settings.template}
            onChange={(e) => update("template", e.target.value as InvoiceSettings["template"])}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500"
          >
            {INVOICE_TEMPLATE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Due days</label>
          <input
            type="number"
            min={1}
            value={settings.due_days}
            onChange={(e) => update("due_days", Number(e.target.value))}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex items-end gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.show_logo}
              onChange={(e) => update("show_logo", e.target.checked)}
              className="h-4 w-4 rounded border-border text-blue-600"
            />
            <span className="text-sm text-foreground">Show logo</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.show_terms}
              onChange={(e) => update("show_terms", e.target.checked)}
              className="h-4 w-4 rounded border-border text-blue-600"
            />
            <span className="text-sm text-foreground">Show terms</span>
          </label>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-foreground mb-1">Terms & conditions</label>
          <textarea
            value={settings.terms}
            onChange={(e) => update("terms", e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-foreground mb-1">Invoice footer</label>
          <textarea
            value={settings.footer}
            onChange={(e) => update("footer", e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );
}
