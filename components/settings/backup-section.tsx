"use client";

import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { upsertOrgSetting } from "@/lib/settings/service";
import { BACKUP_FREQUENCY_OPTIONS } from "@/lib/settings/display";
import type { BackupSettings } from "@/types/settings";
import { DEFAULT_BACKUP_SETTINGS } from "@/types/settings";
import { useToast } from "@/components/ui/toast";
import { Download } from "lucide-react";

interface Props {
  orgId: string;
  initial: BackupSettings;
}

export function BackupSection({ orgId, initial }: Props) {
  const [settings, setSettings] = useState<BackupSettings>({ ...DEFAULT_BACKUP_SETTINGS, ...initial });
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const toast = useToast();

  const update = <K extends keyof BackupSettings>(key: K, value: BackupSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    const supabase = getSupabaseBrowserClient();
    await upsertOrgSetting(supabase, orgId, "backup", settings as never);
    setSaving(false);
    toast.success("Backup settings saved.");
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const [products, orders, customers] = await Promise.all([
        supabase.from("products").select("*"),
        supabase.from("orders").select("*"),
        supabase.from("customers").select("*"),
      ]);

      const exportData = {
        exported_at: new Date().toISOString(),
        products: products.data ?? [],
        orders: orders.data ?? [],
        customers: customers.data ?? [],
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Data exported successfully.");
    } catch {
      toast.error("Export failed.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Backup & Export</h2>
          <p className="text-sm text-muted-foreground">Configure automatic backups and export your data.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={exporting}
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-60 transition cursor-pointer"
          >
            <Download className="h-4 w-4" />
            {exporting ? "Exporting..." : "Export now"}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition cursor-pointer"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
      <div className="space-y-4">
        <label className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3">
          <div>
            <p className="text-sm font-medium text-foreground">Automatic backup</p>
            <p className="text-xs text-muted-foreground">Regularly backup your data to the cloud.</p>
          </div>
          <input
            type="checkbox"
            checked={settings.auto_backup}
            onChange={(e) => update("auto_backup", e.target.checked)}
            className="h-4 w-4 rounded border-border text-blue-600"
          />
        </label>
        {settings.auto_backup && (
          <div className="grid gap-4 sm:grid-cols-3 ml-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Frequency</label>
              <select
                value={settings.backup_frequency}
                onChange={(e) => update("backup_frequency", e.target.value as BackupSettings["backup_frequency"])}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500"
              >
                {BACKUP_FREQUENCY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-4 pt-5">
              {(["include_products", "include_orders", "include_customers"] as const).map((key) => (
                <label key={key} className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={settings[key]}
                    onChange={(e) => update(key, e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-border text-blue-600"
                  />
                  <span className="text-xs text-foreground">
                    {key.replace("include_", "").charAt(0).toUpperCase() + key.replace("include_", "").slice(1)}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}
        {settings.last_backup && (
          <p className="text-xs text-muted-foreground">
            Last backup: {new Date(settings.last_backup).toLocaleString("en-GB")}
          </p>
        )}
      </div>
    </div>
  );
}
