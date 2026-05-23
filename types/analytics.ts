export type MonthlyPoint = {
  key: string;
  label: string;
  revenue: number;
  orders: number;
};

export type CustomerMonthlyPoint = {
  key: string;
  label: string;
  count: number;
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

export type RecentOrderActivity = {
  id: string;
  orderNumber: string;
  customerName: string;
  amountBDT: number;
  status: string;
  createdAt: string;
};

export type AnalyticsSnapshot = {
  loadError?: string;
  
  // 30-day stats
  revenue30d: number;
  revenuePrev30d: number;
  revenueGrowthPct: number | null;
  
  orders30d: number;
  ordersPrev30d: number;
  ordersGrowthPct: number | null;
  
  aov30d: number | null;
  aovPrev30d: number | null;
  aovGrowthPct: number | null;
  
  customerGrowth30d: number;
  customerGrowthPrev30d: number;
  customerGrowthGrowthPct: number | null;
  
  // 7-day stats (weekly)
  revenue7d: number;
  revenuePrev7d: number;
  revenue7dGrowthPct: number | null;
  
  orders7d: number;
  ordersPrev7d: number;
  orders7dGrowthPct: number | null;
  
  repeatBuyerCount: number;
  repeatOrderSharePct: number | null;
  
  monthly: MonthlyPoint[];
  monthlyCustomers: CustomerMonthlyPoint[];
  statusBreakdown: StatusSlice[];
  topProducts: TopProductRow[];
  lowStock: LowStockRow[];
  recentOrders: RecentOrderActivity[];
};
