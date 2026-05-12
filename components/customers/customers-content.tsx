import { buildCustomerOrderStats, mapCustomerToListItem } from "@/lib/customers/map-row";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { CustomersView } from "@/components/customers/customers-view";

export async function CustomersContent() {
  const supabase = await getSupabaseServerClient();
  const { data: rows, error: customersError } = await supabase
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false });

  if (customersError) {
    return (
      <section className="space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Customers</h1>
            <p className="text-sm text-muted-foreground">CRM profiles, notes, and order history in one place.</p>
          </div>
        </header>
        <div className="rounded-xl border border-rose-200 bg-card p-5 text-sm text-rose-700 shadow-sm dark:border-rose-900 dark:text-rose-300">
          <p className="font-medium">Could not load customers</p>
          <p className="mt-1 text-rose-600/90 dark:text-rose-400/90">{customersError.message}</p>
          <p className="mt-3 text-muted-foreground">
            Run{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">supabase/migrations/20260511000002_customers.sql</code>{" "}
            in the Supabase SQL editor (and ensure orders has <code className="rounded bg-muted px-1 py-0.5 text-xs">customer_id</code>
            ), then reload.
          </p>
        </div>
      </section>
    );
  }

  const orderRes = await supabase.from("orders").select("customer_id, amount_bdt");
  const stats = buildCustomerOrderStats(orderRes.error ? [] : (orderRes.data ?? []));
  const initialCustomers = (rows ?? []).map((row) => mapCustomerToListItem(row, stats.get(row.id)));

  return <CustomersView initialCustomers={initialCustomers} />;
}
