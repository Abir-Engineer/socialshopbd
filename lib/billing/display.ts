import type { PaymentStatus } from "@/types/billing";

export function paymentStatusBadgeClass(status: PaymentStatus): string {
  const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold";
  switch (status) {
    case "succeeded": return `${base} bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300`;
    case "pending":   return `${base} bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300`;
    case "failed":    return `${base} bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300`;
    case "refunded":  return `${base} bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300`;
    default:          return `${base} bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300`;
  }
}

export function paymentStatusLabel(status: PaymentStatus): string {
  switch (status) {
    case "succeeded": return "Succeeded";
    case "pending":   return "Pending";
    case "failed":    return "Failed";
    case "refunded":  return "Refunded";
    default:          return status;
  }
}

export function paymentStatusLabelBn(status: PaymentStatus): string {
  switch (status) {
    case "succeeded": return "Succeeded";
    case "pending":   return "Pending";
    case "failed":    return "Failed";
    case "refunded":  return "Refunded";
    default:          return status;
  }
}

export function providerLabel(provider: string): string {
  switch (provider) {
    case "stripe":     return "Stripe";
    case "sslcommerz": return "SSLCommerz";
    case "bkash":      return "bKash";
    case "manual":     return "Manual";
    default:           return provider;
  }
}

export function formatBdt(n: number): string {
  return `৳${Math.round(n).toLocaleString("en-BD")}`;
}
