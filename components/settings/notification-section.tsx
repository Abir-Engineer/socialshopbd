"use client";

import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { upsertNotificationPrefs } from "@/lib/settings/service";
import type { NotificationPrefs } from "@/types/settings";
import { DEFAULT_NOTIFICATION_PREFS } from "@/types/settings";
import { useToast } from "@/components/ui/toast";

interface Props {
  orgId: string;
  initial: NotificationPrefs;
}

const TOGGLES: { key: keyof NotificationPrefs; label: string; desc: string }[] = [
  { key: "email_enabled", label: "Email notifications", desc: "Receive platform updates and order summaries via email." },
  { key: "sms_enabled", label: "SMS notifications", desc: "Get SMS alerts for important updates." },
  { key: "push_enabled", label: "Push notifications", desc: "Receive browser push notifications when you're online." },
  { key: "order_updates", label: "Order updates", desc: "Get notified when orders are created, updated, or completed." },
  { key: "low_stock_alerts", label: "Low stock alerts", desc: "Warning when inventory items are running low." },
  { key: "payment_confirmations", label: "Payment confirmations", desc: "Notifications when payments are received or failed." },
  { key: "marketing_emails", label: "Marketing emails", desc: "Receive product updates, tips, and promotional content." },
  { key: "daily_summary", label: "Daily summary", desc: "End-of-day summary of orders, revenue, and activity." },
];

export function NotificationSection({ orgId, initial }: Props) {
  const [prefs, setPrefs] = useState<NotificationPrefs>({ ...DEFAULT_NOTIFICATION_PREFS, ...initial });
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const toggle = (key: keyof NotificationPrefs) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    const supabase = getSupabaseBrowserClient();
    await upsertNotificationPrefs(supabase, orgId, prefs as never);
    setSaving(false);
    toast.success("Notification preferences saved.");
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Notification Preferences</h2>
          <p className="text-sm text-muted-foreground">Control which notifications you receive and how.</p>
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
      <div className="space-y-2">
        {TOGGLES.map((item) => (
          <label
            key={item.key}
            className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3 hover:bg-muted/30 transition cursor-pointer"
          >
            <div>
              <p className="text-sm font-medium text-foreground">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
            <input
              type="checkbox"
              checked={prefs[item.key]}
              onChange={() => toggle(item.key)}
              className="h-5 w-5 rounded border-border text-blue-600 focus:ring-blue-500"
            />
          </label>
        ))}
      </div>
    </div>
  );
}
