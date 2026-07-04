import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/auth/organization";
import { ProductsView } from "@/components/products/products-view";

type Props = {
  searchParams: { page?: string; query?: string; category?: string; brand?: string; stockStatus?: string };
};

export async function ProductsContent({ searchParams }: Props) {
  const context = await getWorkspaceContext();
  const role = context?.role ?? "viewer";

  const page = Math.max(1, Number(searchParams.page) || 1);
  const perPage = 24;

  const supabase = await getSupabaseServerClient();

  // Count first to determine total pages
  let countQuery = supabase.from("products").select("*", { count: "exact", head: true });
  let dataQuery = supabase.from("products").select("*");

  // Apply search filter at DB level for performance
  const query = searchParams.query?.trim();
  if (query) {
    const like = `%${query}%`;
    countQuery = countQuery.or(`name.ilike.${like},sku.ilike.${like},brand.ilike.${like},barcode.ilike.${like}`);
    dataQuery = dataQuery.or(`name.ilike.${like},sku.ilike.${like},brand.ilike.${like},barcode.ilike.${like}`);
  }
  if (searchParams.category) {
    countQuery = countQuery.eq("category", searchParams.category);
    dataQuery = dataQuery.eq("category", searchParams.category);
  }
  if (searchParams.brand) {
    countQuery = countQuery.eq("brand", searchParams.brand);
    dataQuery = dataQuery.eq("brand", searchParams.brand);
  }

  const { count } = await countQuery;
  const totalCount = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / perPage));
  const safePage = Math.min(page, totalPages);

  const from = (safePage - 1) * perPage;
  const to = from + perPage - 1;

  const { data, error } = await dataQuery
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    return (
      <section className="space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Products</h1>
            <p className="text-sm text-muted-foreground">Monitor product inventory and listing health.</p>
          </div>
        </header>
        <div className="rounded-xl border border-rose-200 bg-card p-5 text-sm text-rose-700 shadow-sm dark:border-rose-900 dark:text-rose-300">
          <p className="font-medium">Could not load products. Please try again.</p>
          <p className="mt-1 text-rose-600/90 dark:text-rose-400/90">Something went wrong. Please refresh the page.</p>
        </div>
      </section>
    );
  }

  return (
    <ProductsView
      initialProducts={data ?? []}
      totalCount={totalCount}
      totalPages={totalPages}
      currentPage={safePage}
      role={role}
    />
  );
}
