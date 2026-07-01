"use client";

import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { updateOrgTheme } from "@/lib/settings/service";
import { THEME_OPTIONS } from "@/lib/settings/display";
import type { Theme, Locale } from "@/types/settings";
import { useToast } from "@/components/ui/toast";

interface Props {
  orgId: string;
  initialTheme: Theme;
  initialLocale: Locale;
}

export function ThemeSection({ orgId, initialTheme, initialLocale }: Props) {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const handleSave = async () => {
    setSaving(true);
    const supabase = getSupabaseBrowserClient();
    await updateOrgTheme(supabase, orgId, theme, locale);
    setSaving(false);
    toast.success("Theme & language settings saved.");
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Theme & Language</h2>
          <p className="text-sm text-muted-foreground">Choose your preferred appearance and locale.</p>
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
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-foreground mb-3">Theme preference</label>
          <div className="grid grid-cols-3 gap-3">
            {THEME_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTheme(opt.value as Theme)}
                className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition cursor-pointer ${
                  theme === opt.value
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                    : "border-border hover:border-muted-foreground/30"
                }`}
              >
                <span className="text-2xl">{opt.icon}</span>
                <span className="text-sm font-medium text-foreground">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Language</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setLocale("en")}
              className={`flex-1 rounded-xl border-2 p-4 text-center transition cursor-pointer ${
                locale === "en"
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                  : "border-border hover:border-muted-foreground/30"
              }`}
            >
              <span className="text-sm font-medium text-foreground">English</span>
            </button>
            <button
              type="button"
              onClick={() => setLocale("bn")}
              className={`flex-1 rounded-xl border-2 p-4 text-center transition cursor-pointer ${
                locale === "bn"
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                  : "border-border hover:border-muted-foreground/30"
              }`}
            >
              <span className="text-sm font-medium text-foreground">বাংলা</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
