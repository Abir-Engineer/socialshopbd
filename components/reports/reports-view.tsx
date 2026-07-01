"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ReportData, ReportPeriod } from "@/types/reports";
import { ReportFilters } from "@/components/reports/report-filters";
import { ReportChart } from "@/components/reports/report-chart";
import { ReportTable } from "@/components/reports/report-table";
import { ExportPdf } from "@/components/reports/export-pdf";
import { ExportExcel } from "@/components/reports/export-excel";
import { formatBdt, formatNumber, formatGrowthPct, growthColor, periodDateRangeLabelBn, periodLabelBn, periodLabel } from "@/lib/reports/display";
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, Package, Users, Layers, Truck } from "lucide-react";
import type { TopCustomerRow, TopProductRow, TopCategoryRow } from "@/types/reports";

type ReportsViewProps = {
  initialData: ReportData;
};

export function ReportsView({ initialData }: ReportsViewProps) {
  const router = useRouter();
  const sp = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState(initialData);
  const [period, setPeriod] = useState<ReportPeriod>(data.period);
  const [from, setFrom] = useState(data.dateRange.from);
  const [to, setTo] = useState(data.dateRange.to);

  const navigate = (p: ReportPeriod, f: string, t: string) => {
    const params = new URLSearchParams();
    params.set("period", p);
    if (f) params.set("from", f);
    if (t) params.set("to", t);
    startTransition(() => {
      router.push(`/reports?${params.toString()}`);
      router.refresh();
    });
  };

  const handlePeriodChange = (p: ReportPeriod) => {
    setPeriod(p);
    navigate(p, from, to);
  };

  const handleFromChange = (v: string) => {
    setFrom(v);
    navigate(period, v, to);
  };

  const handleToChange = (v: string) => {
    setTo(v);
    navigate(period, from, v);
  };

  const { metrics, chart, topCustomers, topProducts, topCategories } = data;

  const MetricCard = ({ metric, icon: Icon, color }: { metric: typeof metrics.revenue; icon: any; color: string }) => (
    <article className="relative overflow-hidden rounded-xl border border-border bg-card p-4 shadow-sm transition hover:shadow-md">
      <div className={`absolute top-0 right-0 h-20 w-20 -mr-4 -mt-4 rounded-full ${color}/5`} />
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{metric.label}</span>
        <div className={`rounded-lg ${color}/10 p-2 ${color === "bg-blue-500" ? "text-blue-600" : color === "bg-emerald-500" ? "text-emerald-600" : color === "bg-amber-500" ? "text-amber-600" : color === "bg-purple-500" ? "text-purple-600" : color === "bg-rose-500" ? "text-rose-600" : "text-muted-foreground"}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3">
        <h3 className="text-2xl font-bold tracking-tight text-foreground">
          {metric.currency ? formatBdt(metric.value) : formatNumber(metric.value)}
        </h3>
        <p className="mt-1 flex items-center gap-1 text-xs font-medium">
          {metric.growthPct !== null ? (
            metric.growthPct >= 0 ? (
              <><TrendingUp className="h-3.5 w-3.5 text-emerald-500 shrink-0" /><span className="text-emerald-600 dark:text-emerald-400">{formatGrowthPct(metric.growthPct)}</span></>
            ) : (
              <><TrendingDown className="h-3.5 w-3.5 text-rose-500 shrink-0" /><span className="text-rose-600 dark:text-rose-400">{formatGrowthPct(metric.growthPct)}</span></>
            )
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
          <span className="text-muted-foreground">vs previous</span>
        </p>
      </div>
    </article>
  );

  return (
    <section className={`space-y-6 ${isPending ? "pointer-events-none opacity-60" : ""} animate-in fade-in duration-300`} aria-busy={isPending}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
            {periodLabelBn(period)} Report
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-foreground">Reports Dashboard</h1>
          <p className="text-sm text-muted-foreground">{periodDateRangeLabelBn(period)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ReportFilters period={period} from={from} to={to} onPeriodChange={handlePeriodChange} onFromChange={handleFromChange} onToChange={handleToChange} />
          <div className="flex gap-2">
            <ExportPdf data={data} />
            <ExportExcel data={data} />
          </div>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <MetricCard metric={metrics.revenue} icon={DollarSign} color="bg-blue-500" />
        <MetricCard metric={metrics.profit} icon={TrendingUp} color="bg-emerald-500" />
        <MetricCard metric={metrics.expenses} icon={ShoppingBag} color="bg-rose-500" />
        <MetricCard metric={metrics.courierCost} icon={Truck} color="bg-amber-500" />
        <MetricCard metric={metrics.orders} icon={Package} color="bg-purple-500" />
        <MetricCard metric={metrics.aov} icon={Layers} color="bg-indigo-500" />
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="text-base font-semibold text-card-foreground mb-4">Revenue & Profit Trend</h3>
        <ReportChart data={chart} period={period} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-card-foreground mb-3 flex items-center gap-2"><Users className="h-4 w-4 text-blue-500" /> Top Customers</h3>
          <ReportTable<TopCustomerRow>
            columns={[
              { key: "name", label: "Name", render: (r) => <span className="font-medium">{r.name}</span> },
              { key: "orders", label: "Orders", render: (r) => formatNumber(r.orderCount), sortable: true, sortValue: (r) => r.orderCount },
              { key: "spent", label: "Spent", render: (r) => formatBdt(r.totalSpent), sortable: true, sortValue: (r) => r.totalSpent },
            ]}
            data={topCustomers}
            emptyMessage="No customer data"
          />
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-card-foreground mb-3 flex items-center gap-2"><Package className="h-4 w-4 text-emerald-500" /> Top Products</h3>
          <ReportTable<TopProductRow>
            columns={[
              { key: "name", label: "Product", render: (r) => <span className="font-medium truncate block max-w-[140px]">{r.name}</span> },
              { key: "units", label: "Sold", render: (r) => formatNumber(r.units), sortable: true, sortValue: (r) => r.units },
              { key: "revenue", label: "Revenue", render: (r) => formatBdt(r.revenue), sortable: true, sortValue: (r) => r.revenue },
              { key: "profit", label: "Profit", render: (r) => <span className={r.profit >= 0 ? "text-emerald-600" : "text-rose-600"}>{formatBdt(r.profit)}</span>, sortable: true, sortValue: (r) => r.profit },
            ]}
            data={topProducts}
            emptyMessage="No product data"
          />
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-card-foreground mb-3 flex items-center gap-2"><Layers className="h-4 w-4 text-purple-500" /> Top Categories</h3>
          <ReportTable<TopCategoryRow>
            columns={[
              { key: "category", label: "Category", render: (r) => <span className="capitalize font-medium">{r.category || "Uncategorized"}</span> },
              { key: "units", label: "Sold", render: (r) => formatNumber(r.units), sortable: true, sortValue: (r) => r.units },
              { key: "revenue", label: "Revenue", render: (r) => formatBdt(r.revenue), sortable: true, sortValue: (r) => r.revenue },
            ]}
            data={topCategories}
            emptyMessage="No category data"
          />
        </div>
      </div>
    </section>
  );
}
