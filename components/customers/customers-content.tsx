import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/auth/organization";
import { CustomersView } from "@/components/customers/customers-view";
import { buildCustomerOrderStats, mapCustomerToListItem } from "@/lib/customers/map-row";
import { extractTags } from "@/services/customers/customer.service";

type Props = {
  searchParams: { page?: string; query?: string; tag?: string; isRepeat?: string; sortBy?: string; sortOrder?: string };
};

export async function CustomersContent({ searchParams }: Props) {
  const context = await getWorkspaceContext();
  const role = context?.role ?? "viewer";
  const supabase = await getSupabaseServerClient();

  const page = Math.max(1, Number(searchParams.page) || 1);
  const perPage = 24;
  const query = searchParams.query?.trim();

  // Fetch customers with optional DB-level search
  let baseQuery = supabase.from("customers").select("*");

  if (query) {
    const like = `%${query}%`;
    baseQuery = baseQuery.or(`name.ilike.${like},phone.ilike.${like},email.ilike.${like}`);
  }

  const { data: customerRows, error } = await baseQuery.order("created_at", { ascending: false });

  if (error) {
    return (
      <section className="space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Customers</h1>
            <p className="text-sm text-muted-foreground">CRM profiles, notes and order history in one place.</p>
          </div>
        </header>
        <div className="rounded-xl border border-rose-200 bg-card p-5 text-sm text-rose-700 shadow-sm dark:border-rose-900 dark:text-rose-300">
          <p className="font-medium">Could not load customers. Please try again.</p>
          <p className="mt-1 text-rose-600/90 dark:text-rose-400/90">Something went wrong. Please refresh the page.</p>
        </div>
      </section>
    );
  }

  // Fetch order stats for all customers
  const { data: orderRows } = await supabase
    .from("orders")
    .select("customer_id, amount_bdt");

  const orderStatsMap = buildCustomerOrderStats(orderRows ?? []);
  const listItems = (customerRows ?? []).map((row) =>
    mapCustomerToListItem(row, orderStatsMap.get(row.id)),
  );

  // Apply client-side tag / repeat filters
  let filtered = listItems;
  const tagFilter = searchParams.tag;
  if (tagFilter) {
    filtered = filtered.filter((c) => c.tags.includes(tagFilter));
  }
  if (searchParams.isRepeat === "yes") {
    filtered = filtered.filter((c) => c.isRepeat);
  } else if (searchParams.isRepeat === "no") {
    filtered = filtered.filter((c) => !c.isRepeat);
  }

  // Apply sort client-side
  const sortBy = searchParams.sortBy ?? "created_at";
  const sortOrder = searchParams.sortOrder ?? "desc";
  filtered.sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case "name":
        comparison = a.fullName.localeCompare(b.fullName);
        break;
      case "orderCount":
        comparison = a.orderCount - b.orderCount;
        break;
      case "totalSpentBdt":
        comparison = a.totalSpentBdt - b.totalSpentBdt;
        break;
      default:
        comparison = a.createdAtLabel.localeCompare(b.createdAtLabel);
    }
    return sortOrder === "desc" ? -comparison : comparison;
  });

  // Paginate
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * perPage;
  const paged = filtered.slice(start, start + perPage);

  // Extract all tags for filter drawer
  const allTags = extractTags(listItems);

  return (
    <CustomersView
      initialCustomers={paged}
      totalCount={total}
      totalPages={totalPages}
      currentPage={safePage}
      allTags={allTags}
      role={role}
    />
  );
}
