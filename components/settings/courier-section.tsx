"use client";

import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { upsertOrgSetting, upsertShop } from "@/lib/settings/service";
import { COURIER_OPTIONS } from "@/lib/settings/display";
import type { CourierSettings } from "@/types/settings";
import { DEFAULT_COURIER_SETTINGS } from "@/types/settings";
import { useToast } from "@/components/ui/toast";

interface Props {
  orgId: string;
  userId: string;
  initial: CourierSettings;
}

export function CourierSection({ orgId, userId, initial }: Props) {
  const [settings, setSettings] = useState<CourierSettings>({ ...DEFAULT_COURIER_SETTINGS, ...initial });
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const update = <K extends keyof CourierSettings>(key: K, value: CourierSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    const supabase = getSupabaseBrowserClient();
    await upsertShop(supabase, userId, { default_courier: settings.default_courier || null });
    await upsertOrgSetting(supabase, orgId, "courier", settings as never);
    setSaving(false);
    toast.success("Courier settings have been saved successfully.");
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Courier Settings</h2>
          <p className="text-sm text-muted-foreground">Configure default courier and API credentials for shipping.</p>
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition cursor-pointer"
        >
          {saving ? "Saving..." : "Save Courier Settings"}
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Default courier</label>
          <select
            value={settings.default_courier}
            onChange={(e) => update("default_courier", e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500"
          >
            <option value="">Select courier</option>
            {COURIER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <h3 className="text-sm font-semibold text-foreground mb-3 pt-2 border-t border-border">Steadfast</h3>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">API Key</label>
          <input
            type="password"
            value={settings.steadfast_api_key}
            onChange={(e) => update("steadfast_api_key", e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Secret Key</label>
          <input
            type="password"
            value={settings.steadfast_secret_key}
            onChange={(e) => update("steadfast_secret_key", e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500"
          />
        </div>
        <div className="sm:col-span-2">
          <h3 className="text-sm font-semibold text-foreground mb-3 pt-2 border-t border-border">Pathao</h3>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Email</label>
          <input
            value={settings.pathao_email}
            onChange={(e) => update("pathao_email", e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Password</label>
          <input
            type="password"
            value={settings.pathao_password}
            onChange={(e) => update("pathao_password", e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500"
          />
        </div>
        <div className="sm:col-span-2">
          <h3 className="text-sm font-semibold text-foreground mb-3 pt-2 border-t border-border">RedX</h3>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">API Key</label>
          <input
            type="password"
            value={settings.redx_api_key}
            onChange={(e) => update("redx_api_key", e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );
}
