import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import type { AnalyticsSnapshot, LowStockRow, MonthlyPoint, CustomerMonthlyPoint, StatusSlice, TopProductRow, RecentOrderActivity } from "@/types/analytics";

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type OrderItemRow = Database["public"]["Tables"]["order_items"]["Row"];
type ProductRow = Database["public"]["Tables"]["products"]["Row"];
type ExpenseRow = Database["public"]["Tables"]["expenses"]["Row"];

const MS_DAY = 86_400_000;
const LOW_STOCK_THRESHOLD = 10;
const TOP_PRODUCTS_LIMIT = 6;
const LOW_STOCK_LIMIT = 8;
const RECENT_ORDERS_LIMIT = 10;

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

  // Fetch orders, products, customers, and expenses
  const [ordersRes, productsRes, customersRes, expensesRes] = await Promise.all([
    supabase.from("orders").select("id, amount_bdt, status, customer_id, customer_name, order_number, created_at, delivery_charge_bdt, discount_bdt, coupon_discount_bdt, shipping_cost_bdt").gte("created_at", sinceIso),
    supabase.from("products").select("id, name, sku, stock, cost_price_bdt"),
    supabase.from("customers").select("id, created_at").gte("created_at", sinceIso),
    supabase.from("expenses").select("amount_bdt, date").gte("date", sinceIso),
  ]);

  const emptyMonthly = (): MonthlyPoint[] =>
    buildLast12MonthKeys().map((key) => ({
      key,
      label: labelForMonthKey(key),
      revenue: 0,
      orders: 0,
      profit: 0,
      courierCost: 0,
    }));

  const emptyMonthlyCustomers = (): CustomerMonthlyPoint[] =>
    buildLast12MonthKeys().map((key) => ({
      key,
      label: labelForMonthKey(key),
      count: 0,
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
      aov30d: null,
      aovPrev30d: null,
      aovGrowthPct: null,
      customerGrowth30d: 0,
      customerGrowthPrev30d: 0,
      customerGrowthGrowthPct: null,
      revenue7d: 0,
      revenuePrev7d: 0,
      revenue7dGrowthPct: null,
      orders7d: 0,
      ordersPrev7d: 0,
      orders7dGrowthPct: null,
      repeatBuyerCount: 0,
      repeatOrderSharePct: null,
      profit30d: 0,
      courierCost30d: 0,
      expenses30d: 0,
      monthly: emptyMonthly(),
      monthlyCustomers: emptyMonthlyCustomers(),
      statusBreakdown: [],
      topProducts: [],
      lowStock: [],
      recentOrders: [],
    };
  }

  const orders = ordersRes.data ?? [];
  const products = productsRes.data ?? [];
  const customers = customersRes.error ? [] : (customersRes.data ?? []);
  const expenses = expensesRes.error ? [] : (expensesRes.data ?? []);

  const productCostMap = new Map<string, number>();
  for (const p of products) {
    productCostMap.set(p.id, p.cost_price_bdt);
  }

  // OPTIMIZED QUERY: Fetch order items only for the recent orders in the snapshot window
  const orderIds = orders.map((o) => o.id);
  const itemsRes = orderIds.length > 0
    ? await supabase.from("order_items").select("product_id, quantity, line_total_bdt, order_id").in("order_id", orderIds)
    : { data: [], error: null };

  const items = itemsRes.error ? [] : (itemsRes.data ?? []);

  const itemsByOrder = new Map<string, { product_id: string; quantity: number; line_total_bdt: number }[]>();
  for (const item of items) {
    const list = itemsByOrder.get(item.order_id) ?? [];
    list.push(item);
    itemsByOrder.set(item.order_id, list);
  }

  const now = Date.now();
  
  // 30d and 60d thresholds
  const cur30Start = now - 30 * MS_DAY;
  const prev30Start = now - 60 * MS_DAY;
  const prev30End = cur30Start;

  // 7d and 14d thresholds (weekly)
  const cur7Start = now - 7 * MS_DAY;
  const prev7Start = now - 14 * MS_DAY;
  const prev7End = cur7Start;

  let revenue30d = 0;
  let revenuePrev30d = 0;
  let orders30d = 0;
  let ordersPrev30d = 0;
  let profit30d = 0;
  let courierCost30d = 0;

  let revenue7d = 0;
  let revenuePrev7d = 0;
  let orders7d = 0;
  let ordersPrev7d = 0;

  const monthMap = new Map<string, { revenue: number; orders: number; profit: number; courierCost: number }>();
  for (const key of buildLast12MonthKeys()) {
    monthMap.set(key, { revenue: 0, orders: 0, profit: 0, courierCost: 0 });
  }

  const statusMap = new Map<string, { count: number; revenue: number }>();
  const customerCounts = new Map<string, number>();

  function calcCogs(o: { id: string }): number {
    const orderItems = itemsByOrder.get(o.id) ?? [];
    let cogs = 0;
    for (const item of orderItems) {
      cogs += (productCostMap.get(item.product_id) ?? 0) * item.quantity;
    }
    return cogs;
  }

  for (const o of orders) {
    const t = new Date(o.created_at).getTime();
    const rev = revenueForOrder(o);
    const cogs = calcCogs(o);
    const shippingCost = o.shipping_cost_bdt ?? 0;
    const discountTotal = (o.discount_bdt ?? 0) + (o.coupon_discount_bdt ?? 0);
    const profit = rev - cogs - shippingCost - discountTotal;

    // 30 day periods
    if (t >= cur30Start) {
      revenue30d += rev;
      orders30d += 1;
      profit30d += profit;
      courierCost30d += shippingCost;
    } else if (t >= prev30Start && t < prev30End) {
      revenuePrev30d += rev;
      ordersPrev30d += 1;
    }

    // 7 day periods
    if (t >= cur7Start) {
      revenue7d += rev;
      orders7d += 1;
    } else if (t >= prev7Start && t < prev7End) {
      revenuePrev7d += rev;
      ordersPrev7d += 1;
    }

    const mk = monthKeyFromIso(o.created_at);
    if (mk && monthMap.has(mk)) {
      const b = monthMap.get(mk)!;
      b.revenue += rev;
      b.orders += 1;
      b.profit += profit;
      b.courierCost += shippingCost;
    }

    const st = statusMap.get(o.status) ?? { count: 0, revenue: 0 };
    st.count += 1;
    st.revenue += o.amount_bdt;
    statusMap.set(o.status, st);

    if (o.customer_id) {
      customerCounts.set(o.customer_id, (customerCounts.get(o.customer_id) ?? 0) + 1);
    }
  }

  // Customer Growth metrics
  let customerGrowth30d = 0;
  let customerGrowthPrev30d = 0;
  const customerMonthMap = new Map<string, number>();
  for (const key of buildLast12MonthKeys()) {
    customerMonthMap.set(key, 0);
  }

  for (const c of customers) {
    const t = new Date(c.created_at).getTime();
    if (t >= cur30Start) {
      customerGrowth30d += 1;
    } else if (t >= prev30Start && t < prev30End) {
      customerGrowthPrev30d += 1;
    }

    const mk = monthKeyFromIso(c.created_at);
    if (mk && customerMonthMap.has(mk)) {
      customerMonthMap.set(mk, customerMonthMap.get(mk)! + 1);
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
    return { key, label: labelForMonthKey(key), revenue: b.revenue, orders: b.orders, profit: b.profit, courierCost: b.courierCost };
  });

  const monthlyCustomers: CustomerMonthlyPoint[] = buildLast12MonthKeys().map((key) => {
    const count = customerMonthMap.get(key) || 0;
    return { key, label: labelForMonthKey(key), count };
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

  const recentOrders: RecentOrderActivity[] = [...orders]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, RECENT_ORDERS_LIMIT)
    .map((o) => ({
      id: o.id,
      orderNumber: o.order_number,
      customerName: o.customer_name,
      amountBDT: o.amount_bdt,
      status: o.status,
      createdAt: o.created_at,
    }));

  const aov30d = orders30d > 0 ? revenue30d / orders30d : null;
  const aovPrev30d = ordersPrev30d > 0 ? revenuePrev30d / ordersPrev30d : null;

  const expense30dStart = new Date(Date.now() - 30 * MS_DAY).toISOString().slice(0, 10);
  const expenses30d = expenses
    .filter((e) => e.date >= expense30dStart)
    .reduce((s, e) => s + e.amount_bdt, 0);

  return {
    revenue30d,
    revenuePrev30d,
    revenueGrowthPct: pctGrowth(revenue30d, revenuePrev30d),
    orders30d,
    ordersPrev30d,
    ordersGrowthPct: pctGrowth(orders30d, ordersPrev30d),
    aov30d,
    aovPrev30d,
    aovGrowthPct: aov30d !== null && aovPrev30d !== null ? pctGrowth(aov30d, aovPrev30d) : null,
    customerGrowth30d,
    customerGrowthPrev30d,
    customerGrowthGrowthPct: pctGrowth(customerGrowth30d, customerGrowthPrev30d),
    
    // Weekly comparisons
    revenue7d,
    revenuePrev7d,
    revenue7dGrowthPct: pctGrowth(revenue7d, revenuePrev7d),
    orders7d,
    ordersPrev7d,
    orders7dGrowthPct: pctGrowth(orders7d, ordersPrev7d),

    profit30d: Math.max(0, profit30d - expenses30d),
    courierCost30d,
    expenses30d,

    repeatBuyerCount,
    repeatOrderSharePct,
    monthly,
    monthlyCustomers,
    statusBreakdown,
    topProducts,
    lowStock,
    recentOrders,
  };
}
