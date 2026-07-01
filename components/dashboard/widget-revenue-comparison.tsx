"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp } from "lucide-react";
import type { MonthlyPoint } from "@/types/analytics";

interface Props {
  monthly: MonthlyPoint[];
}

export function WidgetRevenueComparison({ monthly }: Props) {
  const current = monthly.slice(-6);
  const previous = monthly.slice(-12, -6);

  const data = current.map((c, i) => ({
    month: c.label,
    current: c.revenue,
    previous: previous[i]?.revenue ?? 0,
  }));

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
        <TrendingUp className="h-4 w-4 text-blue-500" />
        <h3 className="text-sm font-semibold text-foreground">Revenue Comparison</h3>
      </div>
      <div className="px-2 py-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={4} barSize={20}>
            <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", background: "var(--card)" }}
              formatter={(v) => [`৳${Number(v).toLocaleString("en-BD")}`]}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="previous" name="Previous" fill="var(--muted-foreground)" opacity={0.3} radius={[4, 4, 0, 0]} />
            <Bar dataKey="current" name="Current" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
