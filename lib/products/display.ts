import type { ProductRow, ProductVariant } from "@/types/products";
import type { Json } from "@/types/supabase";

export type StockStatusLabel = "in_stock" | "low_stock" | "out_of_stock";

export function getStockStatus(stock: number): StockStatusLabel {
  if (stock <= 0) return "out_of_stock";
  if (stock <= 10) return "low_stock";
  return "in_stock";
}

export function getStockStatusLabel(status: StockStatusLabel): string {
  switch (status) {
    case "in_stock":
      return "In Stock";
    case "low_stock":
      return "Low Stock";
    case "out_of_stock":
      return "Out of Stock";
  }
}

export function formatPriceBdt(amount: number): string {
  return `৳${amount.toLocaleString("en-BD")}`;
}

export function formatPriceBdtShort(amount: number): string {
  if (amount >= 100000) return `৳${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `৳${(amount / 1000).toFixed(1)}k`;
  return `৳${amount}`;
}

export function productStats(products: ProductRow[]) {
  const total = products.length;
  let inStock = 0;
  let lowStock = 0;
  let outOfStock = 0;
  let totalValue = 0;

  for (const p of products) {
    const s = getStockStatus(p.stock);
    if (s === "out_of_stock") outOfStock += 1;
    else if (s === "low_stock") lowStock += 1;
    else inStock += 1;
    totalValue += p.stock * p.price_bdt;
  }

  return { total, inStock, lowStock, outOfStock, totalValue };
}

export function statusBadgeClass(status: StockStatusLabel): string {
  const base = "rounded-full px-2.5 py-1 text-xs font-medium";

  if (status === "out_of_stock") {
    return `${base} bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200`;
  }

  if (status === "low_stock") {
    return `${base} bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200`;
  }

  return `${base} bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200`;
}

export function getLowStockCount(products: ProductRow[]): number {
  return products.filter((p) => p.stock > 0 && p.stock <= 10).length;
}

export function getOutOfStockCount(products: ProductRow[]): number {
  return products.filter((p) => p.stock <= 0).length;
}

export function parseVariants(json: Json): ProductVariant[] {
  if (!Array.isArray(json)) return [];
  return json as ProductVariant[];
}

export function getTotalStockWithVariants(product: ProductRow): number {
  const variants = parseVariants(product.variants);
  if (variants.length === 0) return product.stock;
  return variants.reduce((sum, v) => sum + v.stock, 0);
}

export function calculateProfit(priceBdt: number, costPriceBdt: number): number {
  return priceBdt - costPriceBdt;
}

export function calculateProfitMargin(priceBdt: number, costPriceBdt: number): number {
  if (priceBdt <= 0) return 0;
  return ((priceBdt - costPriceBdt) / priceBdt) * 100;
}
