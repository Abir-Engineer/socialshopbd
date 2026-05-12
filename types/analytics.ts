export type MonthlyPoint = {
  key: string;
  label: string;
  revenue: number;
  orders: number;
};

export type StatusSlice = {
  status: string;
  count: number;
  revenue: number;
};

export type TopProductRow = {
  productId: string;
  name: string;
  sku: string;
  units: number;
  revenue: number;
};

export type LowStockRow = {
  id: string;
  name: string;
  sku: string;
  stock: number;
};

export type AnalyticsSnapshot = {
  loadError?: string;
  /** Revenue last 30 days (excludes returned). */
  revenue30d: number;
  revenuePrev30d: number;
  revenueGrowthPct: number | null;
  orders30d: number;
  ordersPrev30d: number;
  ordersGrowthPct: number | null;
  /** Distinct customers with 2+ orders in the loaded window. */
  repeatBuyerCount: number;
  /** Among last-30d orders with a linked customer, share that belong to repeat buyers. */
  repeatOrderSharePct: number | null;
  aov30d: number | null;
  monthly: MonthlyPoint[];
  statusBreakdown: StatusSlice[];
  topProducts: TopProductRow[];
  lowStock: LowStockRow[];
};
