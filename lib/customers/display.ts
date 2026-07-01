import type { CustomerListItem, CustomerStats, CustomerAddress, CustomerPhone } from "@/types/customers";

export function formatLtv(amount: number): string {
  if (amount >= 100000) return `৳${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `৳${(amount / 1000).toFixed(1)}k`;
  return `৳${amount}`;
}

export function formatLtvFull(amount: number): string {
  return `৳${amount.toLocaleString("en-BD")}`;
}

export function customerStats(customers: CustomerListItem[]): CustomerStats {
  let totalLtv = 0;
  let repeatBuyers = 0;
  let totalOrders = 0;

  for (const c of customers) {
    totalLtv += c.totalSpentBdt;
    totalOrders += c.orderCount;
    if (c.isRepeat) repeatBuyers += 1;
  }

  return {
    totalCustomers: customers.length,
    repeatBuyers,
    totalLtv,
    avgOrderValue: totalOrders > 0 ? Math.round(totalLtv / totalOrders) : 0,
  };
}

export function tagBadgeClass(tag: string): string {
  const colors = [
    "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
    "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200",
    "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
    "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200",
    "bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-200",
    "bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-200",
    "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200",
  ];
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return `inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors[Math.abs(hash) % colors.length]}`;
}

export function primaryPhone(phones: CustomerPhone[], fallback: string): string {
  const primary = phones.find((p) => p.is_primary);
  return primary?.number ?? phones[0]?.number ?? fallback;
}

export function defaultAddress(addresses: CustomerAddress[]): CustomerAddress | null {
  return addresses.find((a) => a.is_default) ?? addresses[0] ?? null;
}

export function formatAddress(a: CustomerAddress): string {
  const parts = [a.street, a.city, a.state, a.zip, a.country].filter(Boolean);
  return parts.join(", ");
}
