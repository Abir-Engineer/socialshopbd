import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import type { ReportPeriod, DateRange, ReportData, ReportMetric, ReportDataPoint, TopCustomerRow, TopProductRow, TopCategoryRow, ExpenseRow } from "@/types/reports";

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type OrderItemRow = Database["public"]["Tables"]["order_items"]["Row"];
type ProductRow = Database["public"]["Tables"]["products"]["Row"];

const TOP_LIMIT = 10;

function labelForDate(date: Date, period: ReportPeriod): string {
  if (period === "daily") return date.toLocaleDateString("en-BD", { hour: "2-digit" });
  if (period === "weekly") return date.toLocaleDateString("en-BD", { weekday: "short", day: "numeric" });
  if (period === "monthly") return date.toLocaleDateString("en-BD", { day: "numeric", month: "short" });
  return date.toLocaleDateString("en-BD", { month: "short", year: "numeric" });
}

function pctGrowth(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}

function buildPeriodPoints(period: ReportPeriod, fromDate: Date, toDate: Date): { start: Date; end: Date; label: string; key: string }[] {
  const points: { start: Date; end: Date; label: string; key: string }[] = [];
  const cursor = new Date(fromDate);

  if (period === "daily") {
    cursor.setHours(0, 0, 0, 0);
    const endDay = new Date(toDate);
    endDay.setHours(23, 59, 59, 999);
    while (cursor <= endDay) {
      const s = new Date(cursor);
      const e = new Date(cursor);
      e.setHours(23, 59, 59, 999);
      points.push({ start: s, end: e, label: labelForDate(s, period), key: s.toISOString().slice(0, 10) });
      cursor.setDate(cursor.getDate() + 1);
    }
  } else if (period === "weekly") {
    cursor.setDate(cursor.getDate() - cursor.getDay());
    cursor.setHours(0, 0, 0, 0);
    while (cursor <= toDate) {
      const s = new Date(cursor);
      const e = new Date(cursor);
      e.setDate(e.getDate() + 6);
      e.setHours(23, 59, 59, 999);
      points.push({ start: s, end: e, label: labelForDate(s, period), key: s.toISOString().slice(0, 10) });
      cursor.setDate(cursor.getDate() + 7);
    }
  } else if (period === "monthly") {
    cursor.setDate(1);
    cursor.setHours(0, 0, 0, 0);
    while (cursor <= toDate) {
      const s = new Date(cursor);
      const e = new Date(cursor);
      e.setMonth(e.getMonth() + 1);
      e.setDate(0);
      e.setHours(23, 59, 59, 999);
      points.push({ start: s, end: e, label: labelForDate(s, period), key: s.toISOString().slice(0, 7) });
      cursor.setMonth(cursor.getMonth() + 1);
    }
  } else {
    cursor.setMonth(0, 1);
    cursor.setHours(0, 0, 0, 0);
    while (cursor <= toDate) {
      const s = new Date(cursor);
      const e = new Date(cursor);
      e.setFullYear(e.getFullYear() + 1);
      e.setMonth(0, 0);
      e.setHours(23, 59, 59, 999);
      points.push({ start: s, end: e, label: labelForDate(s, period), key: String(s.getFullYear()) });
      cursor.setFullYear(cursor.getFullYear() + 1);
    }
  }

  return points;
}

function computePeriodBounds(period: ReportPeriod): { current: DateRange; previous: DateRange } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (period === "daily") {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    return {
      current: { from: today.toISOString().slice(0, 10), to: today.toISOString().slice(0, 10) },
      previous: { from: yesterday.toISOString().slice(0, 10), to: yesterday.toISOString().slice(0, 10) },
    };
  }

  if (period === "weekly") {
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const prevWeekStart = new Date(weekStart);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);
    const prevWeekEnd = new Date(weekStart);
    prevWeekEnd.setDate(prevWeekEnd.getDate() - 1);
    return {
      current: { from: weekStart.toISOString().slice(0, 10), to: today.toISOString().slice(0, 10) },
      previous: { from: prevWeekStart.toISOString().slice(0, 10), to: prevWeekEnd.toISOString().slice(0, 10) },
    };
  }

  if (period === "monthly") {
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const prevMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const prevMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
    return {
      current: { from: monthStart.toISOString().slice(0, 10), to: today.toISOString().slice(0, 10) },
      previous: { from: prevMonthStart.toISOString().slice(0, 10), to: prevMonthEnd.toISOString().slice(0, 10) },
    };
  }

  const yearStart = new Date(today.getFullYear(), 0, 1);
  const prevYearStart = new Date(today.getFullYear() - 1, 0, 1);
  const prevYearEnd = new Date(today.getFullYear() - 1, 11, 31);
  return {
    current: { from: yearStart.toISOString().slice(0, 10), to: today.toISOString().slice(0, 10) },
    previous: { from: prevYearStart.toISOString().slice(0, 10), to: prevYearEnd.toISOString().slice(0, 10) },
  };
}

function revenueForOrder(o: Pick<OrderRow, "amount_bdt" | "status">): number {
  return o.status === "returned" ? 0 : o.amount_bdt;
}

function costOfGoodsSold(productCostMap: Map<string, number>, items: Pick<OrderItemRow, "product_id" | "quantity">[]): number {
  let cogs = 0;
  for (const item of items) {
    const costPrice = productCostMap.get(item.product_id) ?? 0;
    cogs += costPrice * item.quantity;
  }
  return cogs;
}

export async function buildReport(
  supabase: SupabaseClient<Database>,
  period: ReportPeriod,
  customRange?: DateRange,
): Promise<ReportData> {
  const organizationId = (await supabase.auth.getUser()).data.user?.id;
  if (!organizationId) throw new Error("Not authenticated");

  const bounds = customRange ?? computePeriodBounds(period).current;
  const prevBounds = customRange ?? computePeriodBounds(period).previous;

  const fromDate = new Date(bounds.from);
  const toDate = new Date(bounds.to);
  toDate.setHours(23, 59, 59, 999);

  const prevFromDate = new Date(prevBounds.from);
  const prevToDate = new Date(prevBounds.to);
  prevToDate.setHours(23, 59, 59, 999);

  const isoFrom = fromDate.toISOString();
  const isoTo = toDate.toISOString();
  const prevIsoFrom = prevFromDate.toISOString();
  const prevIsoTo = prevToDate.toISOString();

  const [ordersRes, itemsRes, productsRes, customersRes, expensesRes] = await Promise.all([
    supabase.from("orders").select("id, amount_bdt, status, customer_id, customer_name, order_phone, created_at, delivery_charge_bdt, discount_bdt, coupon_discount_bdt, shipping_cost_bdt").or(`and(created_at.gte.${isoFrom},created_at.lte.${isoTo}),and(created_at.gte.${prevIsoFrom},created_at.lte.${prevIsoTo})`),
    supabase.from("order_items").select("order_id, product_id, quantity, line_total_bdt"),
    supabase.from("products").select("id, name, sku, category, cost_price_bdt"),
    supabase.from("customers").select("id, name, phone"),
    supabase.from("expenses").select("id, organization_id, amount_bdt, category, description, date, created_by, created_at").gte("date", bounds.from).lte("date", bounds.to),
  ]);

  const orders = (ordersRes.data ?? []) as OrderRow[];
  const items = (itemsRes.data ?? []) as OrderItemRow[];
  const products = (productsRes.data ?? []) as ProductRow[];
  const expenses = (expensesRes.data ?? []) as ExpenseRow[];

  const productCostMap = new Map<string, number>();
  const productNameMap = new Map<string, string>();
  const productSkuMap = new Map<string, string>();
  const productCategoryMap = new Map<string, string>();
  for (const p of products) {
    productCostMap.set(p.id, p.cost_price_bdt);
    productNameMap.set(p.id, p.name);
    productSkuMap.set(p.id, p.sku);
    productCategoryMap.set(p.id, p.category ?? "");
  }

  const itemsByOrder = new Map<string, OrderItemRow[]>();
  for (const item of items) {
    const list = itemsByOrder.get(item.order_id) ?? [];
    list.push(item);
    itemsByOrder.set(item.order_id, list);
  }

  function computeMetrics(orderList: OrderRow[]): { revenue: number; profit: number; courierCost: number; discountTotal: number; orderCount: number } {
    let revenue = 0;
    let courierCost = 0;
    let discountTotal = 0;
    let cogs = 0;
    let orderCount = 0;

    for (const o of orderList) {
      if (o.status === "returned" || o.status === "cancelled") continue;
      revenue += revenueForOrder(o);
      courierCost += o.shipping_cost_bdt ?? 0;
      discountTotal += (o.discount_bdt ?? 0) + (o.coupon_discount_bdt ?? 0);
      orderCount += 1;

      const orderItems = itemsByOrder.get(o.id) ?? [];
      cogs += costOfGoodsSold(productCostMap, orderItems);
    }

    return { revenue, profit: revenue - cogs - courierCost - discountTotal, courierCost, discountTotal, orderCount };
  }

  const currentOrders = orders.filter((o) => {
    const t = new Date(o.created_at).getTime();
    return t >= fromDate.getTime() && t <= toDate.getTime();
  });
  const previousOrders = orders.filter((o) => {
    const t = new Date(o.created_at).getTime();
    return t >= prevFromDate.getTime() && t <= prevToDate.getTime();
  });

  const cur = computeMetrics(currentOrders);
  const prev = computeMetrics(previousOrders);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount_bdt, 0);

  const metrics = {
    revenue: { label: "Revenue", value: cur.revenue, previous: prev.revenue, growthPct: pctGrowth(cur.revenue, prev.revenue), currency: true } satisfies ReportMetric,
    profit: { label: "Profit", value: cur.profit - totalExpenses, previous: prev.profit, growthPct: pctGrowth(cur.profit - totalExpenses, prev.profit), currency: true } satisfies ReportMetric,
    expenses: { label: "Expenses", value: totalExpenses, previous: 0, growthPct: null, currency: true } satisfies ReportMetric,
    courierCost: { label: "Courier Cost", value: cur.courierCost, previous: prev.courierCost, growthPct: pctGrowth(cur.courierCost, prev.courierCost), currency: true } satisfies ReportMetric,
    orders: { label: "Orders", value: cur.orderCount, previous: prev.orderCount, growthPct: pctGrowth(cur.orderCount, prev.orderCount), currency: false } satisfies ReportMetric,
    aov: { label: "AOV", value: cur.orderCount > 0 ? cur.revenue / cur.orderCount : 0, previous: prev.orderCount > 0 ? prev.revenue / prev.orderCount : 0, growthPct: cur.orderCount > 0 && prev.orderCount > 0 ? pctGrowth(cur.revenue / cur.orderCount, prev.revenue / prev.orderCount) : null, currency: true } satisfies ReportMetric,
  };

  const points = buildPeriodPoints(period, fromDate, toDate);
  const pointMap = new Map<string, { revenue: number; profit: number; expenses: number; courierCost: number; orders: number }>();
  for (const p of points) {
    pointMap.set(p.key, { revenue: 0, profit: 0, expenses: 0, courierCost: 0, orders: 0 });
  }

  for (const o of currentOrders) {
    const dateStr = o.created_at.slice(0, period === "yearly" ? 4 : period === "monthly" ? 7 : 10);
    const point = pointMap.get(dateStr);
    if (point) {
      const rev = revenueForOrder(o);
      point.revenue += rev;
      point.orders += 1;
      point.courierCost += o.shipping_cost_bdt ?? 0;

      const orderItems = itemsByOrder.get(o.id) ?? [];
      const cogs = costOfGoodsSold(productCostMap, orderItems);
      const discountTotal = (o.discount_bdt ?? 0) + (o.coupon_discount_bdt ?? 0);
      point.profit += rev - cogs - (o.shipping_cost_bdt ?? 0) - discountTotal;
    }
  }

  const dailyExpenses = new Map<string, number>();
  for (const e of expenses) {
    const key = period === "yearly" ? e.date.slice(0, 4) : period === "monthly" ? e.date.slice(0, 7) : e.date;
    dailyExpenses.set(key, (dailyExpenses.get(key) ?? 0) + e.amount_bdt);
  }
  for (const [key, val] of dailyExpenses) {
    const point = pointMap.get(key);
    if (point) point.expenses += val;
  }

  const chart: ReportDataPoint[] = points.map((p) => {
    const d = pointMap.get(p.key) ?? { revenue: 0, profit: 0, expenses: 0, courierCost: 0, orders: 0 };
    return { label: p.label, ...d };
  });

  const customerAgg = new Map<string, { name: string; phone: string; orderCount: number; totalSpent: number }>();
  for (const o of currentOrders) {
    if (o.status === "returned" || o.status === "cancelled") continue;
    const cid = o.customer_id ?? "anonymous";
    const entry = customerAgg.get(cid) ?? { name: o.customer_name, phone: o.order_phone ?? "", orderCount: 0, totalSpent: 0 };
    entry.orderCount += 1;
    entry.totalSpent += revenueForOrder(o);
    customerAgg.set(cid, entry);
  }
  const topCustomers: TopCustomerRow[] = Array.from(customerAgg.entries())
    .filter(([cid]) => cid !== "anonymous")
    .map(([customerId, v]) => ({ customerId, name: v.name, phone: v.phone, orderCount: v.orderCount, totalSpent: v.totalSpent }))
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, TOP_LIMIT);

  const productAgg = new Map<string, { name: string; sku: string; units: number; revenue: number; cost: number }>();
  for (const o of currentOrders) {
    if (o.status === "returned" || o.status === "cancelled") continue;
    const orderItems = itemsByOrder.get(o.id) ?? [];
    for (const item of orderItems) {
      const entry = productAgg.get(item.product_id) ?? { name: productNameMap.get(item.product_id) ?? "Unknown", sku: productSkuMap.get(item.product_id) ?? "", units: 0, revenue: 0, cost: 0 };
      entry.units += item.quantity;
      entry.revenue += item.line_total_bdt;
      entry.cost += (productCostMap.get(item.product_id) ?? 0) * item.quantity;
      productAgg.set(item.product_id, entry);
    }
  }
  const topProducts: TopProductRow[] = Array.from(productAgg.entries())
    .map(([productId, v]) => ({ productId, name: v.name, sku: v.sku, units: v.units, revenue: v.revenue, profit: v.revenue - v.cost }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, TOP_LIMIT);

  const categoryAgg = new Map<string, { units: number; revenue: number }>();
  for (const o of currentOrders) {
    if (o.status === "returned" || o.status === "cancelled") continue;
    const orderItems = itemsByOrder.get(o.id) ?? [];
    for (const item of orderItems) {
      const cat = productCategoryMap.get(item.product_id) ?? "Uncategorized";
      const entry = categoryAgg.get(cat) ?? { units: 0, revenue: 0 };
      entry.units += item.quantity;
      entry.revenue += item.line_total_bdt;
      categoryAgg.set(cat, entry);
    }
  }
  const topCategories: TopCategoryRow[] = Array.from(categoryAgg.entries())
    .map(([category, v]) => ({ category, units: v.units, revenue: v.revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, TOP_LIMIT);

  return { period, dateRange: bounds, metrics, chart, topCustomers, topProducts, topCategories };
}
