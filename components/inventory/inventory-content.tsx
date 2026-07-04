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
            <h1 className="text-2xl font-semibold text-foreground">Inventory</h1>
            <p className="text-sm text-muted-foreground">Monitor stock levels and inventory health.</p>
          </div>
        </header>
        <div className="rounded-xl border border-rose-200 bg-card p-5 text-sm text-rose-700 shadow-sm dark:border-rose-900 dark:text-rose-300">
          <p className="font-medium">Could not load inventory. Please try again.</p>
          <p className="mt-1 text-rose-600/90 dark:text-rose-400/90">Something went wrong. Please refresh the page.</p>
        </div>
      </section>
    );
  }

  return <InventoryView initialItems={data ?? []} role={role} />;
}
