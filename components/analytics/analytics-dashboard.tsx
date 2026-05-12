"use client";

import type { ReactNode } from "react";
import type { AnalyticsSnapshot, MonthlyPoint, StatusSlice, TopProductRow } from "@/types/analytics";
import { ORDER_STATUSES, type OrderStatus } from "@/types/orders";
import { formatOrderStatusLabel } from "@/lib/orders/map-row";
import { getOrderStatusBadgeClass } from "@/utils/order-status";

type AnalyticsDashboardProps = {
  snapshot: AnalyticsSnapshot;
};

function formatBdt(n: number): string {
  return `BDT ${Math.round(n).toLocaleString("en-BD")}`;
}

function formatPct(n: number | null): string {
  if (n === null || Number.isNaN(n)) return "—";
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

function statusBadgeClass(status: string): string {
  if ((ORDER_STATUSES as readonly string[]).includes(status)) {
    return getOrderStatusBadgeClass(status as OrderStatus);
  }
  return "rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200";
}

function StatCard({
  label,
  value,
  sub,
  trend,
}: {
  label: string;
  value: string;
  sub?: string;
  trend?: { pct: number | null; label: string };
}) {
  return (
    <div className="min-w-0">
      <div className="group relative h-full overflow-hidden rounded-2xl border border-border/80 bg-card p-4 shadow-sm ring-1 ring-black/[0.04] transition hover:shadow-md sm:p-5 dark:ring-white/[0.06]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-60" />
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-card-foreground">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
      {trend && (
        <p
          className={`mt-3 text-xs font-medium ${
            trend.pct === null
              ? "text-muted-foreground"
              : trend.pct >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
          }`}
        >
          {trend.pct === null ? "—" : formatPct(trend.pct)} <span className="font-normal text-muted-foreground">{trend.label}</span>
        </p>
      )}
      </div>
    </div>
  );
}

function MonthlyGrowthChart({ points }: { points: MonthlyPoint[] }) {
  const maxRev = Math.max(1, ...points.map((p) => p.revenue));
  const hasData = points.some((p) => p.revenue > 0 || p.orders > 0);

  if (!hasData) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-4 text-center">
        <p className="text-sm font-medium text-foreground">No revenue in the last 12 months</p>
        <p className="mt-1 max-w-sm text-xs text-muted-foreground">
          Record orders (excluding returned) to see monthly revenue growth here.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex h-56 items-end gap-1.5 sm:gap-2">
        {points.map((p) => {
          const h = Math.max(6, (p.revenue / maxRev) * 100);
          return (
            <div key={p.key} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2">
              <div
                className="group/bar relative w-full max-w-[3.5rem] rounded-t-lg bg-gradient-to-t from-blue-700 via-blue-500 to-sky-400 shadow-inner shadow-blue-900/20 dark:from-blue-900 dark:via-blue-600 dark:to-sky-500"
                style={{ height: `${h}%` }}
                title={`${p.label}: ${formatBdt(p.revenue)} · ${p.orders} orders`}
              >
                <span className="pointer-events-none absolute -top-8 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-card px-2 py-1 text-[10px] font-medium text-card-foreground shadow-md group-hover/bar:block">
                  {formatBdt(p.revenue)}
                </span>
              </div>
              <span className="w-full truncate text-center text-[10px] font-medium text-muted-foreground sm:text-xs">
                {p.label.split(" ")[0]}
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground">Monthly revenue (excludes returned orders)</p>
    </div>
  );
}

function MonthlyOrdersVolumeChart({ points }: { points: MonthlyPoint[] }) {
  const maxOrd = Math.max(1, ...points.map((p) => p.orders));
  const hasData = points.some((p) => p.orders > 0);

  if (!hasData) {
    return (
      <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/15 px-4 text-center">
        <p className="text-sm font-medium text-foreground">No orders in the last 12 months</p>
        <p className="mt-1 max-w-sm text-xs text-muted-foreground">Create orders to see monthly volume here.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex h-44 items-end gap-1.5 sm:gap-2">
        {points.map((p) => {
          const h = Math.max(5, (p.orders / maxOrd) * 100);
          return (
            <div key={p.key} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2">
              <div
                className="group/bar-o relative w-full max-w-[3.5rem] rounded-t-lg bg-gradient-to-t from-emerald-800 via-emerald-500 to-teal-400 shadow-inner shadow-emerald-900/25 dark:from-emerald-950 dark:via-emerald-600 dark:to-teal-500"
                style={{ height: `${h}%` }}
                title={`${p.label}: ${p.orders} orders`}
              >
                <span className="pointer-events-none absolute -top-8 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-card px-2 py-1 text-[10px] font-medium text-card-foreground shadow-md group-hover/bar-o:block">
                  {p.orders} orders
                </span>
              </div>
              <span className="w-full truncate text-center text-[10px] font-medium text-muted-foreground sm:text-xs">
                {p.label.split(" ")[0]}
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground">Monthly order count (all statuses)</p>
    </div>
  );
}

function StatusBreakdown({ slices }: { slices: StatusSlice[] }) {
  const total = slices.reduce((a, s) => a + s.count, 0) || 1;
  const maxCount = Math.max(1, ...slices.map((s) => s.count));

  if (slices.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 text-sm text-muted-foreground">
        No order status data
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {slices.map((s) => (
        <li key={s.status} className="space-y-1.5">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className={`inline-flex items-center gap-1.5 ${statusBadgeClass(s.status)}`}>
              {formatOrderStatusLabel(s.status as OrderStatus)}
            </span>
            <span className="text-muted-foreground">
              {s.count} <span className="text-[10px]">({Math.round((s.count / total) * 100)}%)</span>
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-slate-500 to-slate-400 dark:from-slate-400 dark:to-slate-500"
              style={{ width: `${(s.count / maxCount) * 100}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground">Revenue (incl. returned): {formatBdt(s.revenue)}</p>
        </li>
      ))}
    </ul>
  );
}

function HorizontalMetricBars({
  rows,
  valueKey,
  maxValue,
  empty,
}: {
  rows: TopProductRow[];
  valueKey: "revenue" | "units";
  maxValue: number;
  empty: ReactNode;
}) {
  if (rows.length === 0) {
    return <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">{empty}</div>;
  }

  const max = Math.max(1, maxValue);

  return (
    <ul className="space-y-3">
      {rows.map((row) => {
        const v = valueKey === "revenue" ? row.revenue : row.units;
        const w = (v / max) * 100;
        return (
          <li key={row.productId} className="space-y-1">
            <div className="flex items-baseline justify-between gap-2 text-xs">
              <span className="truncate font-medium text-card-foreground">{row.name}</span>
              <span className="shrink-0 text-muted-foreground">{valueKey === "revenue" ? formatBdt(row.revenue) : `${row.units} units`}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-400 dark:from-violet-500 dark:to-indigo-400"
                style={{ width: `${w}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground">SKU {row.sku}</p>
          </li>
        );
      })}
    </ul>
  );
}

export function AnalyticsDashboard({ snapshot }: AnalyticsDashboardProps) {
  const {
    loadError,
    revenue30d,
    revenuePrev30d,
    revenueGrowthPct,
    orders30d,
    ordersPrev30d,
    ordersGrowthPct,
    repeatBuyerCount,
    repeatOrderSharePct,
    aov30d,
    monthly,
    statusBreakdown,
    topProducts,
    lowStock,
  } = snapshot;

  const maxTopRev = topProducts.length ? Math.max(...topProducts.map((p) => p.revenue)) : 0;

  return (
    <section className="space-y-8">
      <header className="space-y-2">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600/90 dark:text-blue-400/90">Insights</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">Analytics</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Revenue, orders, customers, and inventory in one Stripe-inspired view — powered by your Supabase data.
            </p>
          </div>
        </div>
      </header>

      {loadError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 shadow-sm dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-100">
          <p className="font-medium">Could not load analytics</p>
          <p className="mt-1 opacity-90">{loadError}</p>
        </div>
      )}

      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-card-foreground">Key metrics</h2>
          <p className="text-xs text-muted-foreground">Revenue, orders, and repeat buyers · last 30 days vs prior period where shown</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenue (30 days)"
          value={formatBdt(revenue30d)}
          sub="Excludes returned orders"
          trend={{ pct: revenueGrowthPct, label: "vs prior 30 days" }}
        />
        <StatCard
          label="Orders (30 days)"
          value={String(orders30d)}
          sub="All statuses in period"
          trend={{ pct: ordersGrowthPct, label: "vs prior 30 days" }}
        />
        <StatCard
          label="Avg. order value"
          value={aov30d === null ? "—" : formatBdt(aov30d)}
          sub="Last 30 days · non-returned revenue"
        />
        <StatCard
          label="Repeat buyers"
          value={String(repeatBuyerCount)}
          sub="Customers with 2+ orders (15 mo. window)"
        />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.06] sm:p-6 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-card-foreground">Charts</h2>
              <p className="text-xs text-muted-foreground">Revenue and order volume · last 12 months</p>
            </div>
          </div>
          <div className="mt-8 space-y-10">
            <div>
              <h3 className="text-sm font-medium text-foreground">Revenue</h3>
              <div className="mt-4">
                <MonthlyGrowthChart points={monthly} />
              </div>
            </div>
            <div className="border-t border-border/60 pt-10">
              <h3 className="text-sm font-medium text-foreground">Orders</h3>
              <div className="mt-4">
                <MonthlyOrdersVolumeChart points={monthly} />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.06] sm:p-6">
          <h2 className="text-lg font-semibold text-card-foreground">Order status</h2>
          <p className="text-xs text-muted-foreground">Volume mix · loaded window</p>
          <div className="mt-6">
            <StatusBreakdown slices={statusBreakdown} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.06] sm:p-6">
          <h2 className="text-lg font-semibold text-card-foreground">Repeat customers</h2>
          <p className="mt-1 text-xs text-muted-foreground">Linked orders (customer_id) in the last 30 days</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border/60 bg-gradient-to-br from-emerald-500/[0.08] to-transparent p-4 dark:from-emerald-500/10">
              <p className="text-xs font-medium text-muted-foreground">Repeat buyers</p>
              <p className="mt-2 text-3xl font-semibold text-card-foreground">{repeatBuyerCount}</p>
              <p className="mt-1 text-[11px] leading-snug text-muted-foreground">Distinct customers with 2+ orders in window.</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-gradient-to-br from-indigo-500/[0.08] to-transparent p-4 dark:from-indigo-500/10">
              <p className="text-xs font-medium text-muted-foreground">Repeat share (30d)</p>
              <p className="mt-2 text-3xl font-semibold text-card-foreground">
                {repeatOrderSharePct === null ? "—" : `${repeatOrderSharePct.toFixed(0)}%`}
              </p>
              <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                Of recent linked orders, how many are from repeat buyers.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.06] sm:p-6">
          <h2 className="text-lg font-semibold text-card-foreground">Top products</h2>
          <p className="mt-1 text-xs text-muted-foreground">By line revenue · order_items</p>
          <div className="mt-6">
            <HorizontalMetricBars
              rows={topProducts}
              valueKey="revenue"
              maxValue={maxTopRev}
              empty={
                <>
                  <p className="font-medium text-foreground">No line items yet</p>
                  <p className="mt-2 text-xs">
                    Add rows to <code className="rounded bg-muted px-1">order_items</code> (see migration) to rank products by
                    sales.
                  </p>
                </>
              }
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.06] sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-card-foreground">Low stock alerts</h2>
            <p className="text-xs text-muted-foreground">Products at or below {10} units</p>
          </div>
        </div>
        {lowStock.length === 0 ? (
          <div className="mt-8 flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/15 py-12 text-center">
            <p className="text-sm font-medium text-foreground">All clear</p>
            <p className="mt-1 max-w-md text-xs text-muted-foreground">No products are currently at or below the low-stock threshold.</p>
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-[520px] w-full text-left text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="py-3 pr-4 font-medium">Product</th>
                  <th className="py-3 pr-4 font-medium">SKU</th>
                  <th className="py-3 font-medium">Stock</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map((p) => (
                  <tr key={p.id} className="border-b border-border/60 last:border-0">
                    <td className="py-3 pr-4 font-medium text-card-foreground">{p.name}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{p.sku}</td>
                    <td className="py-3">
                      <span
                        className={
                          p.stock === 0
                            ? "rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-800 dark:bg-rose-950/50 dark:text-rose-200"
                            : "rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900 dark:bg-amber-950/50 dark:text-amber-100"
                        }
                      >
                        {p.stock}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border/80 bg-gradient-to-br from-slate-900/[0.03] via-card to-card p-5 shadow-sm ring-1 ring-black/[0.04] dark:from-white/[0.04] dark:via-card dark:to-card dark:ring-white/[0.06] sm:p-6">
        <h2 className="text-lg font-semibold text-card-foreground">Order stats · comparison</h2>
        <p className="mt-1 text-xs text-muted-foreground">Last 30 days vs previous 30 days</p>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="min-w-0 rounded-xl border border-border/60 bg-card/80 p-4 backdrop-blur-sm">
            <p className="text-xs text-muted-foreground">Orders</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{orders30d}</p>
            <p className="mt-1 text-xs text-muted-foreground">Prev {ordersPrev30d}</p>
          </div>
          <div className="min-w-0 rounded-xl border border-border/60 bg-card/80 p-4 backdrop-blur-sm">
            <p className="text-xs text-muted-foreground">Revenue</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{formatBdt(revenue30d)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Prev {formatBdt(revenuePrev30d)}</p>
          </div>
          <div className="min-w-0 rounded-xl border border-border/60 bg-card/80 p-4 backdrop-blur-sm">
            <p className="text-xs text-muted-foreground">Revenue growth</p>
            <p
              className={`mt-1 text-2xl font-semibold tabular-nums ${
                revenueGrowthPct === null
                  ? "text-muted-foreground"
                  : revenueGrowthPct >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {formatPct(revenueGrowthPct)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Vs prior 30 days</p>
          </div>
          <div className="min-w-0 rounded-xl border border-border/60 bg-card/80 p-4 backdrop-blur-sm">
            <p className="text-xs text-muted-foreground">Order growth</p>
            <p
              className={`mt-1 text-2xl font-semibold tabular-nums ${
                ordersGrowthPct === null
                  ? "text-muted-foreground"
                  : ordersGrowthPct >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {formatPct(ordersGrowthPct)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Count vs prior period</p>
          </div>
        </div>
      </div>
    </section>
  );
}
