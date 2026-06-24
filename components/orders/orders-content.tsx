import { orderRowToListItem } from "@/lib/orders/map-row";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/auth/organization";
import { OrdersView } from "@/components/orders/orders-view";

export async function OrdersContent() {
  const context = await getWorkspaceContext();
  const role = context?.role ?? "viewer";

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
  const linkRes = await supabase.from("customers").select("id, name, phone").order("name");

  const linkCustomers =
    linkRes.error || !linkRes.data
      ? []
      : linkRes.data.map((c) => ({
          id: c.id,
          label: `${c.name} (${c.phone})`,
        }));

  if (error) {
    return (
      <section className="space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">অর্ডার ব্যবস্থাপনা</h1>
            <p className="text-sm text-muted-foreground">সকল গ্রাহকের অর্ডার ট্র্যাক এবং পরিচালনা করুন।</p>
          </div>
        </header>
        <div className="rounded-xl border border-rose-200 bg-card p-5 text-sm text-rose-700 shadow-sm dark:border-rose-900 dark:text-rose-300">
          <p className="font-medium">অর্ডার লোড করা যায়নি</p>
          <p className="mt-1 text-rose-600/90 dark:text-rose-400/90">{error.message}</p>
          <p className="mt-3 text-muted-foreground">
            যদি টেবিলটি এখনও না থাকে, তাহলে Supabase SQL এডিটরে{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">supabase/migrations/20260511000001_create_orders.sql</code>{" "}
            SQL চালান, তারপর রিলোড করুন।
          </p>
        </div>
      </section>
    );
  }

  const initialOrders = (data ?? []).map(orderRowToListItem);
  return <OrdersView initialOrders={initialOrders} linkCustomers={linkCustomers} role={role} />;
}
