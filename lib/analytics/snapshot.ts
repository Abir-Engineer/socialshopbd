import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import type { AnalyticsSnapshot, LowStockRow, MonthlyPoint, StatusSlice, TopProductRow } from "@/types/analytics";

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];

const MS_DAY = 86_400_000;
const LOW_STOCK_THRESHOLD = 10;
const TOP_PRODUCTS_LIMIT = 6;
const LOW_STOCK_LIMIT = 8;

function monthKeyFromIso(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function labelForMonthKey(key: string): string {
  const [y, m] = key.split("-").map(Number);
  if (!y || !m) return key;
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

function buildLast12MonthKeys(): string[] {
  const keys: string[] = [];
  const anchor = new Date();
  anchor.setDate(1);
  for (let i = 11; i >= 0; i -= 1) {
    const d = new Date(anchor.getFullYear(), anchor.getMonth() - i, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return keys;
}

function revenueForOrder(o: Pick<OrderRow, "amount_bdt" | "status">): number {
  return o.status === "returned" ? 0 : o.amount_bdt;
}

function pctGrowth(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}

export async function buildAnalyticsSnapshot(
  supabase: SupabaseClient<Database>,
): Promise<AnalyticsSnapshot> {
  const since = new Date();
  since.setMonth(since.getMonth() - 15);
  const sinceIso = since.toISOString();

  const [ordersRes, productsRes, itemsRes] = await Promise.all([
    supabase.from("orders").select("id, amount_bdt, status, customer_id, created_at").gte("created_at", sinceIso),
    supabase.from("products").select("id, name, sku, stock").order("stock", { ascending: true }),
    supabase.from("order_items").select("product_id, quantity, line_total_bdt"),
  ]);

  const emptyMonthly = (): MonthlyPoint[] =>
    buildLast12MonthKeys().map((key) => ({
      key,
      label: labelForMonthKey(key),
      revenue: 0,
      orders: 0,
    }));

  if (ordersRes.error) {
    return {
      loadError: ordersRes.error.message,
      revenue30d: 0,
      revenuePrev30d: 0,
      revenueGrowthPct: null,
      orders30d: 0,
      ordersPrev30d: 0,
      ordersGrowthPct: null,
      repeatBuyerCount: 0,
      repeatOrderSharePct: null,
      aov30d: null,
      monthly: emptyMonthly(),
      statusBreakdown: [],
      topProducts: [],
      lowStock: [],
    };
  }

  const orders = ordersRes.data ?? [];
  const products = productsRes.data ?? [];
  const items = itemsRes.error ? [] : (itemsRes.data ?? []);

  const now = Date.now();
  const cur30Start = now - 30 * MS_DAY;
  const prev30Start = now - 60 * MS_DAY;
  const prev30End = cur30Start;

  let revenue30d = 0;
  let revenuePrev30d = 0;
  let orders30d = 0;
  let ordersPrev30d = 0;

  const monthMap = new Map<string, { revenue: number; orders: number }>();
  for (const key of buildLast12MonthKeys()) {
    monthMap.set(key, { revenue: 0, orders: 0 });
  }

  const statusMap = new Map<string, { count: number; revenue: number }>();
  const customerCounts = new Map<string, number>();

  for (const o of orders) {
    const t = new Date(o.created_at).getTime();
    const rev = revenueForOrder(o);

    if (t >= cur30Start) {
      revenue30d += rev;
      orders30d += 1;
    } else if (t >= prev30Start && t < prev30End) {
      revenuePrev30d += rev;
      ordersPrev30d += 1;
    }

    const mk = monthKeyFromIso(o.created_at);
    if (mk && monthMap.has(mk)) {
      const b = monthMap.get(mk)!;
      b.revenue += rev;
      b.orders += 1;
    }

    const st = statusMap.get(o.status) ?? { count: 0, revenue: 0 };
    st.count += 1;
    st.revenue += o.amount_bdt;
    statusMap.set(o.status, st);

    if (o.customer_id) {
      customerCounts.set(o.customer_id, (customerCounts.get(o.customer_id) ?? 0) + 1);
    }
  }

  const repeatCustomerIds = new Set<string>();
  for (const [cid, c] of customerCounts) {
    if (c >= 2) repeatCustomerIds.add(cid);
  }
  const repeatBuyerCount = repeatCustomerIds.size;

  let linked30 = 0;
  let repeatLinked30 = 0;
  for (const o of orders) {
    const t = new Date(o.created_at).getTime();
    if (t < cur30Start) continue;
    if (!o.customer_id) continue;
    linked30 += 1;
    if (repeatCustomerIds.has(o.customer_id)) repeatLinked30 += 1;
  }
  const repeatOrderSharePct = linked30 > 0 ? (repeatLinked30 / linked30) * 100 : null;

  const monthly: MonthlyPoint[] = buildLast12MonthKeys().map((key) => {
    const b = monthMap.get(key)!;
    return { key, label: labelForMonthKey(key), revenue: b.revenue, orders: b.orders };
  });

  const statusBreakdown: StatusSlice[] = Array.from(statusMap.entries())
    .map(([status, v]) => ({ status, count: v.count, revenue: v.revenue }))
    .sort((a, b) => b.count - a.count);

  const productById = new Map(products.map((p) => [p.id, p]));
  const agg = new Map<string, { units: number; revenue: number }>();
  for (const row of items) {
    const cur = agg.get(row.product_id) ?? { units: 0, revenue: 0 };
    cur.units += row.quantity;
    cur.revenue += row.line_total_bdt;
    agg.set(row.product_id, cur);
  }
  const topProducts: TopProductRow[] = Array.from(agg.entries())
    .map(([productId, v]) => {
      const p = productById.get(productId);
      return {
        productId,
        name: p?.name ?? "Unknown product",
        sku: p?.sku ?? "—",
        units: v.units,
        revenue: v.revenue,
      };
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, TOP_PRODUCTS_LIMIT);

  const lowStock: LowStockRow[] = products
    .filter((p) => p.stock <= LOW_STOCK_THRESHOLD)
    .slice(0, LOW_STOCK_LIMIT)
    .map((p) => ({ id: p.id, name: p.name, sku: p.sku, stock: p.stock }));

  const aov30d = orders30d > 0 ? revenue30d / orders30d : null;

  return {
    revenue30d,
    revenuePrev30d,
    revenueGrowthPct: pctGrowth(revenue30d, revenuePrev30d),
    orders30d,
    ordersPrev30d,
    ordersGrowthPct: pctGrowth(orders30d, ordersPrev30d),
    repeatBuyerCount,
    repeatOrderSharePct,
    aov30d,
    monthly,
    statusBreakdown,
    topProducts,
    lowStock,
  };
}
