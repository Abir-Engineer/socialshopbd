import type { OrderStatus } from "@/types/orders";

export function getOrderStatusBadgeClass(status: OrderStatus): string {
  const base = "rounded-full px-2.5 py-1 text-xs font-medium";

  switch (status) {
    case "delivered":
      return `${base} bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300`;
    case "pending":
      return `${base} bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200`;
    case "returned":
      return `${base} bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200`;
    case "confirmed":
      return `${base} bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-200`;
    case "packed":
      return `${base} bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-200`;
    case "shipped":
      return `${base} bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200`;
    default:
      return `${base} bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200`;
  }
}
