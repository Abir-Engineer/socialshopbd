"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Users,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Activity,
  Package,
  Calendar,
} from "lucide-react";
import type { AnalyticsSnapshot, MonthlyPoint, TopProductRow, StatusSlice } from "@/types/analytics";
import { formatOrderStatusLabel } from "@/lib/orders/map-row";
import { getOrderStatusBadgeClass } from "@/utils/order-status";
import { type OrderStatus } from "@/types/orders";

type AnalyticsDashboardProps = {
  snapshot: AnalyticsSnapshot;
};

function formatBdt(n: number): string {
  return `৳${Math.round(n).toLocaleString("en-BD")}`;
}

function formatPct(n: number | null): string {
  if (n === null || Number.isNaN(n)) return "—";
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

function statusBadgeClass(status: string): string {
  try {
    return getOrderStatusBadgeClass(status as OrderStatus);
  } catch {
    return "rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200";
  }
}

// Custom tooltip for Sales/Revenue AreaChart
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-border bg-card/95 p-3 shadow-xl backdrop-blur-sm">
        <p className="text-xs font-semibold text-foreground mb-1">{label}</p>
        <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
          Revenue: <span className="font-mono">{formatBdt(payload[0].value)}</span>
        </p>
        {payload[1] && (
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-0.5">
            Orders: <span className="font-mono">{payload[1].value}</span>
          </p>
        )}
      </div>
    );
  }
  return null;
}

// Custom tooltip for Customer Growth BarChart
function CustomerTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-border bg-card/95 p-3 shadow-xl backdrop-blur-sm">
        <p className="text-xs font-semibold text-foreground mb-1">{label}</p>
        <p className="text-xs font-medium text-violet-600 dark:text-violet-400">
          New Customers: <span className="font-mono">{payload[0].value}</span>
        </p>
      </div>
    );
  }
  return null;
}

// Custom tooltip for Top Products BarChart
function ProductTooltip({ active, payload }: { active?: boolean; payload?: { payload: { name: string; units: number; revenue: number } }[] }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-xl border border-border bg-card/95 p-3 shadow-xl backdrop-blur-sm">
        <p className="text-xs font-semibold text-foreground mb-1">{data.name}</p>
        <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
          Units Sold: <span className="font-mono">{data.units}</span>
        </p>
        <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-0.5">
          Revenue: <span className="font-mono">{formatBdt(data.revenue)}</span>
        </p>
      </div>
    );
  }
  return null;
}

export function AnalyticsDashboard({ snapshot }: AnalyticsDashboardProps) {
  const [mounted, setMounted] = useState(false);
  const [timeframe, setTimeframe] = useState<"30d" | "7d">("30d");

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const {
    loadError,
    revenue30d,
    revenuePrev30d,
    revenueGrowthPct,
    orders30d,
    ordersPrev30d,
    ordersGrowthPct,
    aov30d,
    aovPrev30d,
    aovGrowthPct,
    customerGrowth30d,
    customerGrowthPrev30d,
    customerGrowthGrowthPct,
    revenue7d,
    revenuePrev7d,
    revenue7dGrowthPct,
    orders7d,
    ordersPrev7d,
    orders7dGrowthPct,
    repeatBuyerCount,
    repeatOrderSharePct,
    monthly,
    monthlyCustomers,
    statusBreakdown,
    topProducts,
    lowStock,
    recentOrders,
  } = snapshot;

  if (loadError) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 shadow-sm dark:border-rose-900/30 dark:bg-rose-950/20 dark:text-rose-100">
        <h3 className="font-semibold">Error Loading Analytics</h3>
        <p className="mt-1 opacity-90">{loadError}</p>
      </div>
    );
  }

  // Active metrics based on timeframe
  const displayRevenue = timeframe === "30d" ? revenue30d : revenue7d;
  const displayRevenuePrev = timeframe === "30d" ? revenuePrev30d : revenuePrev7d;
  const displayRevenueGrowth = timeframe === "30d" ? revenueGrowthPct : revenue7dGrowthPct;

  const displayOrders = timeframe === "30d" ? orders30d : orders7d;
  const displayOrdersPrev = timeframe === "30d" ? ordersPrev30d : ordersPrev7d;
  const displayOrdersGrowth = timeframe === "30d" ? ordersGrowthPct : orders7dGrowthPct;

  // Pie chart calculation for Pending vs Delivered
  const deliveredCount = statusBreakdown.find((s) => s.status === "delivered")?.count || 0;
  const pendingCount = statusBreakdown
    .filter((s) => s.status !== "delivered" && s.status !== "returned" && s.status !== "cancelled")
    .reduce((acc, s) => acc + s.count, 0);
  const returnedCount = statusBreakdown.find((s) => s.status === "returned")?.count || 0;
  const otherCount = statusBreakdown
    .filter((s) => s.status === "cancelled")
    .reduce((acc, s) => acc + s.count, 0);

  const statusPieData = [
    { name: "Delivered", value: deliveredCount, color: "#10b981" },
    { name: "Pending / Processing", value: pendingCount, color: "#3b82f6" },
    { name: "Returned", value: returnedCount, color: "#f59e0b" },
    { name: "Cancelled", value: otherCount, color: "#ef4444" },
  ].filter((d) => d.value > 0);

  return (
    <section className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
            Realtime Analytics
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Insights Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitor real-time sales performance, customer growth, and operational metrics.
          </p>
        </div>

        {/* Timeframe selector */}
        <div className="inline-flex rounded-xl bg-card border border-border p-1 shadow-sm">
          <button
            onClick={() => setTimeframe("30d")}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition cursor-pointer ${
              timeframe === "30d"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Last 30 Days
          </button>
          <button
            onClick={() => setTimeframe("7d")}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition cursor-pointer ${
              timeframe === "7d"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Last 7 Days
          </button>
        </div>
      </header>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Revenue Card */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-200 hover:shadow-md group">
          <div className="absolute top-0 right-0 h-24 w-24 -mr-4 -mt-4 rounded-full bg-blue-500/5 dark:bg-blue-500/10 transition-transform duration-300 group-hover:scale-110" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Revenue</span>
            <div className="rounded-xl bg-blue-500/10 p-2.5 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold tracking-tight text-foreground">{formatBdt(displayRevenue)}</h3>
            <p className="mt-2 flex items-center gap-1.5 text-xs font-medium">
              {displayRevenueGrowth !== null ? (
                displayRevenueGrowth >= 0 ? (
                  <>
                    <TrendingUp className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span className="text-emerald-600 dark:text-emerald-400">{formatPct(displayRevenueGrowth)}</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-4 w-4 text-rose-500 shrink-0" />
                    <span className="text-rose-600 dark:text-rose-400">{formatPct(displayRevenueGrowth)}</span>
                  </>
                )
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
              <span className="text-muted-foreground">vs previous period</span>
            </p>
          </div>
        </div>

        {/* Orders Card */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-200 hover:shadow-md group">
          <div className="absolute top-0 right-0 h-24 w-24 -mr-4 -mt-4 rounded-full bg-emerald-500/5 dark:bg-emerald-500/10 transition-transform duration-300 group-hover:scale-110" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Orders Overview</span>
            <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold tracking-tight text-foreground">{displayOrders.toLocaleString()}</h3>
            <p className="mt-2 flex items-center gap-1.5 text-xs font-medium">
              {displayOrdersGrowth !== null ? (
                displayOrdersGrowth >= 0 ? (
                  <>
                    <TrendingUp className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span className="text-emerald-600 dark:text-emerald-400">{formatPct(displayOrdersGrowth)}</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-4 w-4 text-rose-500 shrink-0" />
                    <span className="text-rose-600 dark:text-rose-400">{formatPct(displayOrdersGrowth)}</span>
                  </>
                )
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
              <span className="text-muted-foreground">vs previous period</span>
            </p>
          </div>
        </div>

        {/* AOV Card */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-200 hover:shadow-md group">
          <div className="absolute top-0 right-0 h-24 w-24 -mr-4 -mt-4 rounded-full bg-indigo-500/5 dark:bg-indigo-500/10 transition-transform duration-300 group-hover:scale-110" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Avg. Order Value</span>
            <div className="rounded-xl bg-indigo-500/10 p-2.5 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold tracking-tight text-foreground">{aov30d ? formatBdt(aov30d) : "—"}</h3>
            <p className="mt-2 flex items-center gap-1.5 text-xs font-medium">
              {aovGrowthPct !== null ? (
                aovGrowthPct >= 0 ? (
                  <>
                    <TrendingUp className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span className="text-emerald-600 dark:text-emerald-400">{formatPct(aovGrowthPct)}</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-4 w-4 text-rose-500 shrink-0" />
                    <span className="text-rose-600 dark:text-rose-400">{formatPct(aovGrowthPct)}</span>
                  </>
                )
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
              <span className="text-muted-foreground">vs prior period (30d)</span>
            </p>
          </div>
        </div>

        {/* Customer Growth Card */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-200 hover:shadow-md group">
          <div className="absolute top-0 right-0 h-24 w-24 -mr-4 -mt-4 rounded-full bg-violet-500/5 dark:bg-violet-500/10 transition-transform duration-300 group-hover:scale-110" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Customer Growth</span>
            <div className="rounded-xl bg-violet-500/10 p-2.5 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold tracking-tight text-foreground">{customerGrowth30d.toLocaleString()}</h3>
            <p className="mt-2 flex items-center gap-1.5 text-xs font-medium">
              {customerGrowthGrowthPct !== null ? (
                customerGrowthGrowthPct >= 0 ? (
                  <>
                    <TrendingUp className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span className="text-emerald-600 dark:text-emerald-400">{formatPct(customerGrowthGrowthPct)}</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-4 w-4 text-rose-500 shrink-0" />
                    <span className="text-rose-600 dark:text-rose-400">{formatPct(customerGrowthGrowthPct)}</span>
                  </>
                )
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
              <span className="text-muted-foreground">new signups (30d)</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main charts section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sales Chart (Revenue & Orders) */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm lg:col-span-2 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Sales & Order Volume</h3>
            <p className="text-xs text-muted-foreground">Monthly breakdown over the last 12 months</p>
          </div>

          <div className="h-80 w-full">
            {!mounted ? (
              <div className="h-full w-full animate-pulse bg-muted rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthly} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/40" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    className="text-[10px] font-medium fill-muted-foreground"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `৳${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                    className="text-[10px] font-medium fill-muted-foreground"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    name="revenue"
                  />
                  <Area
                    type="monotone"
                    dataKey="orders"
                    stroke="#10b981"
                    strokeWidth={1.5}
                    fillOpacity={0}
                    name="orders"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Order Status (Pending vs Delivered Pie Chart) */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Pending vs Delivered</h3>
            <p className="text-xs text-muted-foreground">Order status allocation</p>
          </div>

          <div className="h-60 w-full my-auto flex items-center justify-center">
            {!mounted ? (
              <div className="h-36 w-36 animate-pulse rounded-full bg-muted" />
            ) : statusPieData.length === 0 ? (
              <div className="text-sm text-muted-foreground">No data available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${value} orders`, "Volume"]}
                    contentStyle={{ borderRadius: "12px", border: "1px solid var(--border)", background: "var(--card)" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Status Breakdown Legend */}
          <div className="grid grid-cols-2 gap-2 text-xs pt-4 border-t border-border/40">
            {statusPieData.map((s) => (
              <div key={s.name} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                <span className="truncate text-muted-foreground font-medium">{s.name}</span>
                <span className="ml-auto font-mono font-semibold text-foreground">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Selling Products */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Top Selling Products</h3>
              <p className="text-xs text-muted-foreground">Ranked by revenue generated</p>
            </div>
            <Package className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="h-64 w-full">
            {!mounted ? (
              <div className="h-full w-full animate-pulse bg-muted rounded-xl" />
            ) : topProducts.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <p className="text-sm font-semibold">No sales yet</p>
                <p className="text-xs text-muted-foreground mt-1">Products will appear once order items are purchased.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topProducts}
                  layout="vertical"
                  margin={{ top: 5, right: 10, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    width={90}
                    className="text-[10px] font-medium fill-foreground"
                  />
                  <Tooltip content={<ProductTooltip />} />
                  <Bar dataKey="revenue" radius={[0, 6, 6, 0]}>
                    {topProducts.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index === 0 ? "#4f46e5" : index === 1 ? "#6366f1" : "#818cf8"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Customer growth monthly Trend */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">New Customers Trend</h3>
              <p className="text-xs text-muted-foreground">Monthly customer registration volume</p>
            </div>
            <Users className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="h-64 w-full">
            {!mounted ? (
              <div className="h-full w-full animate-pulse bg-muted rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyCustomers} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/40" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    className="text-[10px] font-medium fill-muted-foreground"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                    className="text-[10px] font-medium fill-muted-foreground"
                  />
                  <Tooltip content={<CustomerTooltip />} />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} name="signups" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Recent Orders & Activity</h3>
            <p className="text-xs text-muted-foreground">Most recent orders received in your shop</p>
          </div>
          <Activity className="h-5 w-5 text-muted-foreground animate-pulse" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border/80 text-xs font-semibold text-muted-foreground">
                <th className="pb-3 font-medium">Order Number</th>
                <th className="pb-3 font-medium">Customer</th>
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium">Amount</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    No orders registered yet.
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-border/40 last:border-0 hover:bg-muted/10 transition duration-150"
                  >
                    <td className="py-3.5 font-semibold text-foreground">{order.orderNumber}</td>
                    <td className="py-3.5 text-muted-foreground font-medium">{order.customerName}</td>
                    <td className="py-3.5 text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString("en-BD", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3.5 font-mono font-semibold text-foreground">{formatBdt(order.amountBDT)}</td>
                    <td className="py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusBadgeClass(order.status)}`}>
                        {formatOrderStatusLabel(order.status as OrderStatus)}
                      </span>
                    </td>
                    <td className="py-3.5 text-right">
                      <a
                        href={`/orders`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Details
                        <ArrowUpRight className="h-3 w-3" />
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Low Stock Alerts */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Low Stock Inventory Alerts</h3>
          <p className="text-xs text-muted-foreground">Products running out of stock (less than 10 units remaining)</p>
        </div>

        {lowStock.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-8 text-center bg-muted/5">
            <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2" />
            <p className="text-sm font-semibold text-foreground">All clear</p>
            <p className="text-xs text-muted-foreground">No low-stock products currently detected.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {lowStock.map((prod) => (
              <div
                key={prod.id}
                className="rounded-xl border border-border bg-muted/10 p-4 flex items-center justify-between"
              >
                <div className="min-w-0">
                  <h4 className="font-semibold text-sm truncate text-foreground">{prod.name}</h4>
                  <p className="text-xs text-muted-foreground truncate">SKU: {prod.sku}</p>
                </div>
                <div className="ml-3 shrink-0">
                  <span
                    className={`inline-flex h-8 w-12 items-center justify-center rounded-lg text-xs font-extrabold shadow-sm ${
                      prod.stock === 0
                        ? "bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400"
                        : "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
                    }`}
                  >
                    {prod.stock}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
