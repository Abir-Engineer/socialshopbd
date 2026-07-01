"use client";

import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { upsertOrgSetting } from "@/lib/settings/service";
import type { TaxSettings } from "@/types/settings";
import { DEFAULT_TAX_SETTINGS } from "@/types/settings";
import { useToast } from "@/components/ui/toast";

interface Props {
  orgId: string;
  initial: TaxSettings;
}

export function TaxSection({ orgId, initial }: Props) {
  const [settings, setSettings] = useState<TaxSettings>({ ...DEFAULT_TAX_SETTINGS, ...initial });
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const update = <K extends keyof TaxSettings>(key: K, value: TaxSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    const supabase = getSupabaseBrowserClient();
    await upsertOrgSetting(supabase, orgId, "tax", settings as never);
    setSaving(false);
    toast.success("Tax settings saved.");
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Tax Settings</h2>
          <p className="text-sm text-muted-foreground">Configure tax rates and tax identification.</p>
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition cursor-pointer"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Tax name</label>
          <input
            value={settings.tax_name}
            onChange={(e) => update("tax_name", e.target.value)}
            placeholder="VAT"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Tax rate (%)</label>
          <input
            type="number"
            min={0}
            max={100}
            step={0.01}
            value={settings.tax_rate}
            onChange={(e) => update("tax_rate", Number(e.target.value))}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Tax ID / VAT number</label>
          <input
            value={settings.tax_number}
            onChange={(e) => update("tax_number", e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.tax_inclusive}
              onChange={(e) => update("tax_inclusive", e.target.checked)}
              className="h-4 w-4 rounded border-border text-blue-600"
            />
            <span className="text-sm text-foreground">Tax inclusive pricing</span>
          </label>
        </div>
      </div>
    </div>
  );
}
