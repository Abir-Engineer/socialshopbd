import type { Database } from "@/types/supabase";

export type ProductRow = Database["public"]["Tables"]["products"]["Row"];

export type ProductVariant = {
  id: string;
  color: string;
  size: string;
  sku: string;
  stock: number;
  price_bdt: number;
  image_url?: string;
};

export type ProductFilters = {
  query: string;
  category: string;
  brand: string;
  stockStatus: string;
  minPrice: number;
  maxPrice: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
};

export type ProductSortOption = {
  label: string;
  value: string;
};

export const PRODUCT_SORT_OPTIONS: ProductSortOption[] = [
  { label: "Newest First", value: "created_at-desc" },
  { label: "Oldest First", value: "created_at-asc" },
  { label: "Name A–Z", value: "name-asc" },
  { label: "Name Z–A", value: "name-desc" },
  { label: "Price Low–High", value: "price_bdt-asc" },
  { label: "Price High–Low", value: "price_bdt-desc" },
  { label: "Stock Low–High", value: "stock-asc" },
  { label: "Stock High–Low", value: "stock-desc" },
];

export const PRODUCT_STOCK_FILTERS = [
  { label: "All", value: "" },
  { label: "In Stock", value: "in_stock" },
  { label: "Low Stock", value: "low_stock" },
  { label: "Out of Stock", value: "out_of_stock" },
];

export const PRODUCT_CATEGORIES = [
  "Electronics",
  "Clothing",
  "Food & Beverage",
  "Health & Beauty",
  "Home & Living",
  "Books",
  "Sports",
  "Toys",
  "Accessories",
  "Other",
] as const;

export type ProductBulkAction = "delete" | "update_category" | "update_brand" | "update_status";

export type ProductFormData = {
  name: string;
  sku: string;
  barcode?: string;
  brand?: string;
  category?: string;
  color?: string;
  size?: string;
  stock: number;
  price_bdt: number;
  cost_price_bdt?: number;
  image_url?: string;
  images?: string[];
  variants?: ProductVariant[];
};

export const DEFAULT_PRODUCT_FILTERS: ProductFilters = {
  query: "",
  category: "",
  brand: "",
  stockStatus: "",
  minPrice: 0,
  maxPrice: 0,
  sortBy: "created_at",
  sortOrder: "desc",
};
