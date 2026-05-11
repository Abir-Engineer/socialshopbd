import type { ProductRow } from "@/types/products";

export type StockStatusLabel = "Active" | "Low Stock" | "Out of Stock";

export function getStockStatus(stock: number): StockStatusLabel {
  if (stock <= 0) return "Out of Stock";
  if (stock <= 10) return "Low Stock";
  return "Active";
}

export function formatPriceBdt(amount: number): string {
  return `BDT ${amount.toLocaleString("en-BD")}`;
}

export function productStats(products: ProductRow[]) {
  const total = products.length;
  let active = 0;
  let lowStock = 0;
  let outOfStock = 0;

  for (const p of products) {
    const s = getStockStatus(p.stock);
    if (s === "Out of Stock") outOfStock += 1;
    else if (s === "Low Stock") lowStock += 1;
    else active += 1;
  }

  return { total, active, lowStock, outOfStock };
}

export function statusBadgeClass(status: StockStatusLabel): string {
  const base =
    "rounded-full px-2.5 py-1 text-xs font-medium";

  if (status === "Out of Stock") {
    return `${base} bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200`;
  }

  if (status === "Low Stock") {
    return `${base} bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200`;
  }

  return `${base} bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200`;
}
