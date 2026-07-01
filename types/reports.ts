export type ReportPeriod = "daily" | "weekly" | "monthly" | "yearly";

export type DateRange = {
  from: string;
  to: string;
};

export type ReportMetric = {
  label: string;
  value: number;
  previous: number;
  growthPct: number | null;
  currency?: boolean;
};

export type ReportDataPoint = {
  label: string;
  revenue: number;
  profit: number;
  expenses: number;
  courierCost: number;
  orders: number;
};

export type TopCustomerRow = {
  customerId: string;
  name: string;
  phone: string;
  orderCount: number;
  totalSpent: number;
};

export type TopProductRow = {
  productId: string;
  name: string;
  sku: string;
  units: number;
  revenue: number;
  profit: number;
};

export type TopCategoryRow = {
  category: string;
  units: number;
  revenue: number;
};

export type ReportData = {
  period: ReportPeriod;
  dateRange: DateRange;
  metrics: {
    revenue: ReportMetric;
    profit: ReportMetric;
    expenses: ReportMetric;
    courierCost: ReportMetric;
    orders: ReportMetric;
    aov: ReportMetric;
  };
  chart: ReportDataPoint[];
  topCustomers: TopCustomerRow[];
  topProducts: TopProductRow[];
  topCategories: TopCategoryRow[];
};

export type ExpenseRow = {
  id: string;
  organization_id: string;
  amount_bdt: number;
  category: string;
  description: string | null;
  date: string;
  created_by: string | null;
  created_at: string;
};
