import { SettingsForm } from "@/components/dashboard/settings-form";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">সেটিংস</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              আপনার অ্যাকাউন্টের বিবরণ এবং ব্যক্তিগতকরণ সেটিংস আপডেট করুন।
            </p>
          </div>
        </div>
      </section>

      <SettingsForm />
    </div>
  );
}
