import type { OrderListItem, OrderStatus, PaymentStatus, OrderStats } from "@/types/orders";

export function getOrderStatusBadgeClass(status: OrderStatus): string {
  const base = "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium";
  switch (status) {
    case "delivered":
      return `${base} bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-400/20`;
    case "pending":
      return `${base} bg-amber-50 text-amber-700 ring-1 ring-amber-600/20 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-400/20`;
    case "returned":
      return `${base} bg-rose-50 text-rose-700 ring-1 ring-rose-600/20 dark:bg-rose-950/30 dark:text-rose-300 dark:ring-rose-400/20`;
    case "confirmed":
      return `${base} bg-sky-50 text-sky-700 ring-1 ring-sky-600/20 dark:bg-sky-950/30 dark:text-sky-300 dark:ring-sky-400/20`;
    case "packed":
      return `${base} bg-violet-50 text-violet-700 ring-1 ring-violet-600/20 dark:bg-violet-950/30 dark:text-violet-300 dark:ring-violet-400/20`;
    case "shipped":
      return `${base} bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/20 dark:bg-indigo-950/30 dark:text-indigo-300 dark:ring-indigo-400/20`;
    default:
      return `${base} bg-slate-50 text-slate-700 ring-1 ring-slate-600/20 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-400/20`;
  }
}

export function getPaymentStatusBadgeClass(status: PaymentStatus): string {
  const base = "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium";
  switch (status) {
    case "paid":
      return `${base} bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200`;
    case "partial":
      return `${base} bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200`;
    case "refunded":
      return `${base} bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200`;
    default:
      return `${base} bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300`;
  }
}

export function formatPaymentStatus(status: PaymentStatus): string {
  switch (status) {
    case "paid": return "Paid";
    case "partial": return "Partial";
    case "refunded": return "Refunded";
    default: return "Unpaid";
  }
}

export function formatOrderStatusLabel(status: OrderStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function computeOrderStats(orders: OrderListItem[]): OrderStats {
  let totalRevenue = 0;
  let pendingCount = 0;
  let deliveredCount = 0;
  let returnedCount = 0;

  for (const o of orders) {
    totalRevenue += o.totalBdt;
    if (o.status === "pending") pendingCount += 1;
    if (o.status === "delivered") deliveredCount += 1;
    if (o.status === "returned") returnedCount += 1;
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayRevenue = orders
    .filter((o) => o.status === "delivered" && new Date(o.date) >= todayStart)
    .reduce((s, o) => s + o.totalBdt, 0);

  return {
    totalOrders: orders.length,
    pendingCount,
    deliveredCount,
    returnedCount,
    totalRevenue,
    todayRevenue,
  };
}
