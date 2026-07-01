import type { ProductRow, ProductFilters, ProductSortOption } from "@/types/products";
import { getStockStatus, type StockStatusLabel } from "@/lib/products/display";

export type ProductFilterResult = {
  products: ProductRow[];
  total: number;
  totalPages: number;
  currentPage: number;
};

export function applyProductFilters(
  products: ProductRow[],
  filters: ProductFilters,
  page: number,
  perPage: number,
): ProductFilterResult {
  let filtered = [...products];

  // Search by name, SKU, barcode, brand
  if (filters.query.trim()) {
    const q = filters.query.toLowerCase().trim();
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q)) ||
        (p.brand && p.brand.toLowerCase().includes(q)),
    );
  }

  // Filter by category
  if (filters.category) {
    filtered = filtered.filter((p) => p.category === filters.category);
  }

  // Filter by brand
  if (filters.brand) {
    filtered = filtered.filter((p) => p.brand === filters.brand);
  }

  // Filter by stock status
  if (filters.stockStatus) {
    filtered = filtered.filter((p) => {
      const status = getStockStatus(p.stock);
      return status === filters.stockStatus;
    });
  }

  // Filter by price range
  if (filters.minPrice > 0) {
    filtered = filtered.filter((p) => p.price_bdt >= filters.minPrice);
  }
  if (filters.maxPrice > 0) {
    filtered = filtered.filter((p) => p.price_bdt <= filters.maxPrice);
  }

  // Sort
  filtered.sort((a, b) => {
    let comparison = 0;
    switch (filters.sortBy) {
      case "name":
        comparison = a.name.localeCompare(b.name);
        break;
      case "price_bdt":
        comparison = a.price_bdt - b.price_bdt;
        break;
      case "stock":
        comparison = a.stock - b.stock;
        break;
      default:
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }
    return filters.sortOrder === "desc" ? -comparison : comparison;
  });

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * perPage;
  const paged = filtered.slice(start, start + perPage);

  return {
    products: paged,
    total,
    totalPages,
    currentPage: safePage,
  };
}

export function extractBrands(products: ProductRow[]): string[] {
  const brands = new Set<string>();
  for (const p of products) {
    if (p.brand) brands.add(p.brand);
  }
  return Array.from(brands).sort();
}

export function extractCategories(products: ProductRow[]): string[] {
  const cats = new Set<string>();
  for (const p of products) {
    if (p.category) cats.add(p.category);
  }
  return Array.from(cats).sort();
}
