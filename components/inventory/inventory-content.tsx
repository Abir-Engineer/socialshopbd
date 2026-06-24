import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/auth/organization";
import { InventoryView } from "@/components/inventory/inventory-view";

export async function InventoryContent() {
  const context = await getWorkspaceContext();
  const role = context?.role ?? "viewer";

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("stock", { ascending: true });

  if (error) {
    return (
      <section className="space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">ইনভেন্টরি ম্যানেজমেন্ট</h1>
            <p className="text-sm text-muted-foreground">স্টক লেভেল ও ইনভেন্টরি স্বাস্থ্য পর্যবেক্ষণ করুন।</p>
          </div>
        </header>
        <div className="rounded-xl border border-rose-200 bg-card p-5 text-sm text-rose-700 shadow-sm dark:border-rose-900 dark:text-rose-300">
          <p className="font-medium">ইনভেন্টরি লোড করা যায়নি</p>
          <p className="mt-1 text-rose-600/90 dark:text-rose-400/90">{error.message}</p>
        </div>
      </section>
    );
  }

  return <InventoryView initialItems={data ?? []} role={role} />;
}
