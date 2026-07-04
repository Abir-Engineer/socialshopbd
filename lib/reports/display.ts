import type { ReportPeriod } from "@/types/reports";

export function periodLabel(period: ReportPeriod): string {
  switch (period) {
    case "daily": return "Daily";
    case "weekly": return "Weekly";
    case "monthly": return "Monthly";
    case "yearly": return "Yearly";
  }
}

export function periodLabelBn(period: ReportPeriod): string {
  switch (period) {
    case "daily": return "Daily";
    case "weekly": return "Weekly";
    case "monthly": return "Monthly";
    case "yearly": return "Yearly";
  }
}

export function formatBdt(n: number): string {
  const rounded = Math.round(n);
  if (rounded >= 1_000_000) return `৳${(rounded / 1_000_000).toFixed(1)}M`;
  if (rounded >= 1_000) return `৳${(rounded / 1_000).toFixed(1)}K`;
  return `৳${rounded.toLocaleString("en-BD")}`;
}

export function formatNumber(n: number): string {
  return Math.round(n).toLocaleString("en-BD");
}

export function formatGrowthPct(pct: number | null): string {
  if (pct === null || Number.isNaN(pct)) return "—";
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

export function growthColor(pct: number | null): string {
  if (pct === null || Number.isNaN(pct)) return "text-muted-foreground";
  return pct >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400";
}

export function periodDateRangeLabel(period: ReportPeriod): string {
  const now = new Date();
  switch (period) {
    case "daily":
      return now.toLocaleDateString("en-BD", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    case "weekly": {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      return `${weekStart.toLocaleDateString("en-BD", { day: "numeric", month: "short" })} - ${now.toLocaleDateString("en-BD", { day: "numeric", month: "short", year: "numeric" })}`;
    }
    case "monthly":
      return now.toLocaleDateString("en-BD", { month: "long", year: "numeric" });
    case "yearly":
      return String(now.getFullYear());
  }
}

export function periodDateRangeLabelBn(period: ReportPeriod): string {
  const now = new Date();
  switch (period) {
    case "daily":
      return now.toLocaleDateString("bn-BD", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    case "weekly": {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      return `${weekStart.toLocaleDateString("bn-BD", { day: "numeric", month: "short" })} - ${now.toLocaleDateString("bn-BD", { day: "numeric", month: "short", year: "numeric" })}`;
    }
    case "monthly":
      return now.toLocaleDateString("bn-BD", { month: "long", year: "numeric" });
    case "yearly":
      return String(now.getFullYear());
  }
}
