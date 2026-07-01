import { Suspense } from "react";
import { SettingsShell } from "@/components/settings/settings-shell";

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="h-7 w-32 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-4 w-64 animate-pulse rounded bg-muted" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[240px_1fr]">
        <div className="h-96 animate-pulse rounded-xl bg-muted" />
        <div className="h-96 animate-pulse rounded-xl bg-muted" />
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <header className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Manage your business profile, preferences, and configuration.
            </p>
          </div>
        </div>
      </header>
      <Suspense fallback={<SettingsSkeleton />}>
        <SettingsShell />
      </Suspense>
    </div>
  );
}
