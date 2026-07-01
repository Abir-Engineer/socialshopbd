"use client";

import type { ReportPeriod } from "@/types/reports";
import { periodLabelBn } from "@/lib/reports/display";

type ReportFiltersProps = {
  period: ReportPeriod;
  from: string;
  to: string;
  onPeriodChange: (p: ReportPeriod) => void;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
};

const periods: ReportPeriod[] = ["daily", "weekly", "monthly", "yearly"];

export function ReportFilters({ period, from, to, onPeriodChange, onFromChange, onToChange }: ReportFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="inline-flex rounded-xl bg-card border border-border p-1 shadow-sm">
        {periods.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPeriodChange(p)}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition cursor-pointer ${
              period === p
                ? "bg-blue-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {periodLabelBn(p)}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 text-sm">
        <input
          type="date"
          value={from}
          onChange={(e) => onFromChange(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground outline-none focus:border-blue-500"
        />
        <span className="text-muted-foreground">—</span>
        <input
          type="date"
          value={to}
          onChange={(e) => onToChange(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground outline-none focus:border-blue-500"
        />
      </div>
    </div>
  );
}
