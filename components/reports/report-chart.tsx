"use client";

import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
import type { ReportDataPoint, ReportPeriod } from "@/types/reports";
import { formatBdt } from "@/lib/reports/display";

type ReportChartProps = {
  data: ReportDataPoint[];
  period: ReportPeriod;
};

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number }[]; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-border bg-card/95 p-3 shadow-xl backdrop-blur-sm">
        <p className="text-xs font-semibold text-foreground mb-1">{label}</p>
        {payload.map((entry, i) => (
          <p key={i} className="text-xs font-medium" style={{ color: entry.name === "revenue" ? "#3b82f6" : entry.name === "profit" ? "#10b981" : "#f59e0b" }}>
            {entry.name === "revenue" ? "Revenue" : entry.name === "profit" ? "Profit" : "Expenses"}: {formatBdt(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export function ReportChart({ data, period }: ReportChartProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    return <div className="h-72 w-full animate-pulse rounded-xl bg-muted" />;
  }

  if (data.length === 0) {
    return <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">No data available</div>;
  }

  if (period === "daily" || period === "weekly") {
    return (
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted/40" vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} className="text-[10px] font-medium fill-muted-foreground" />
            <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `৳${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} className="text-[10px] font-medium fill-muted-foreground" />
            <Tooltip content={<ChartTooltip />} />
            <Legend />
            <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} name="revenue" />
            <Bar dataKey="profit" fill="#10b981" radius={[4, 4, 0, 0]} name="profit" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="chartRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="chartProfit" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted/40" vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} className="text-[10px] font-medium fill-muted-foreground" />
          <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `৳${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} className="text-[10px] font-medium fill-muted-foreground" />
          <Tooltip content={<ChartTooltip />} />
          <Legend />
          <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#chartRevenue)" name="revenue" />
          <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#chartProfit)" name="profit" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
