import type { ProductRow as InventoryItem } from "@/types/products";

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

export function getStockStatus(stock: number): StockStatus {
  if (stock <= 0) return "out_of_stock";
  if (stock <= 10) return "low_stock";
  return "in_stock";
}

export function inventoryStats(items: InventoryItem[]) {
  const total = items.length;
  let inStock = 0;
  let lowStock = 0;
  let outOfStock = 0;

  for (const item of items) {
    const s = getStockStatus(item.stock);
    if (s === "out_of_stock") outOfStock += 1;
    else if (s === "low_stock") lowStock += 1;
    else inStock += 1;
  }

  return { total, inStock, lowStock, outOfStock };
}

export function stockStatusBadge(stock: number): string {
  const status = getStockStatus(stock);
  const base = "rounded-full px-2.5 py-1 text-xs font-medium";

  if (status === "out_of_stock") {
    return `${base} bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200`;
  }

  if (status === "low_stock") {
    return `${base} bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200`;
  }

  return `${base} bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200`;
}

export function stockStatusLabel(stock: number): string {
  const status = getStockStatus(stock);
  if (status === "out_of_stock") return "স্টকে নেই";
  if (status === "low_stock") return "স্বল্প স্টক";
  return "স্টকে আছে";
}
