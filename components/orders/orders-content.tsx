import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/auth/organization";
import { OrdersView } from "@/components/orders/orders-view";
import { orderRowToListItem } from "@/lib/orders/map-row";

type Props = {
  searchParams: { page?: string; query?: string; status?: string; paymentStatus?: string; sortBy?: string; sortOrder?: string };
};

export async function OrdersContent({ searchParams }: Props) {
  const context = await getWorkspaceContext();
  const role = context?.role ?? "viewer";
  const supabase = await getSupabaseServerClient();

  const page = Math.max(1, Number(searchParams.page) || 1);
  const perPage = 20;
  const query = searchParams.query?.trim();

  // Count first
  let countQuery = supabase.from("orders").select("*", { count: "exact", head: true });
  let dataQuery = supabase.from("orders").select("*");

  if (query) {
    const like = `%${query}%`;
    countQuery = countQuery.or(`order_number.ilike.${like},customer_name.ilike.${like},order_phone.ilike.${like}`);
    dataQuery = dataQuery.or(`order_number.ilike.${like},customer_name.ilike.${like},order_phone.ilike.${like}`);
  }
  if (searchParams.status) {
    countQuery = countQuery.eq("status", searchParams.status);
    dataQuery = dataQuery.eq("status", searchParams.status);
  }
  if (searchParams.paymentStatus) {
    countQuery = countQuery.eq("payment_status", searchParams.paymentStatus);
    dataQuery = dataQuery.eq("payment_status", searchParams.paymentStatus);
  }

  const { count } = await countQuery;
  const totalFiltered = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / perPage));
  const safePage = Math.min(page, totalPages);
  const from = (safePage - 1) * perPage;

  const { data: orderRows, error } = await dataQuery
    .order("created_at", { ascending: false })
    .range(from, from + perPage - 1);

  if (error) {
    return (
      <section className="space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Orders</h1>
            <p className="text-sm text-muted-foreground">Manage orders, shipping, and payments.</p>
          </div>
        </header>
        <div className="rounded-xl border border-rose-200 bg-card p-5 text-sm text-rose-700 shadow-sm dark:border-rose-900 dark:text-rose-300">
          <p className="font-medium">Failed to load orders</p>
          <p className="mt-1">{error.message}</p>
        </div>
      </section>
    );
  }

  // Fetch items for the visible page
  const orderIds = (orderRows ?? []).map((o) => o.id);
  let itemMap = new Map<string, any[]>();
  if (orderIds.length > 0) {
    const { data: items } = await supabase.from("order_items").select("*").in("order_id", orderIds);
    for (const item of items ?? []) {
      const list = itemMap.get(item.order_id) ?? [];
      list.push(item);
      itemMap.set(item.order_id, list);
    }
  }

  const listItems = (orderRows ?? []).map((row) =>
    orderRowToListItem(row, itemMap.get(row.id)),
  );

  return (
    <OrdersView
      initialOrders={listItems}
      totalCount={totalFiltered}
      totalPages={totalPages}
      currentPage={safePage}
      role={role}
    />
  );
}
