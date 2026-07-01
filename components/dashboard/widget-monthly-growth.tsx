"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { MonthlyPoint } from "@/types/analytics";

interface Props {
  monthly: MonthlyPoint[];
}

export function WidgetMonthlyGrowth({ monthly }: Props) {
  const data = monthly.map((m) => ({
    month: m.label,
    revenue: m.revenue,
    growth: m.profit,
  }));

  const latest = monthly[monthly.length - 1];
  const prev = monthly[monthly.length - 2];
  const growthPct = prev && prev.revenue > 0
    ? ((latest.revenue - prev.revenue) / prev.revenue) * 100
    : null;

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          {growthPct !== null && growthPct > 0 ? (
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          ) : growthPct !== null && growthPct < 0 ? (
            <TrendingDown className="h-4 w-4 text-rose-500" />
          ) : (
            <Minus className="h-4 w-4 text-muted-foreground" />
          )}
          <h3 className="text-sm font-semibold text-foreground">Monthly Growth</h3>
        </div>
        {growthPct !== null && (
          <span
            className={`text-sm font-bold ${
              growthPct > 0 ? "text-emerald-600 dark:text-emerald-400" : growthPct < 0 ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground"
            }`}
          >
            {growthPct > 0 ? "+" : ""}{growthPct.toFixed(1)}%
          </span>
        )}
      </div>
      <div className="px-2 py-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", background: "var(--card)" }}
              formatter={(v) => [`৳${Number(v).toLocaleString("en-BD")}`]}
            />
            <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#growthGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
