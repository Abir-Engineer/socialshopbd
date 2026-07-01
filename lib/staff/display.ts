import type { MemberStatus, AuditAction, AuditLogEntry } from "@/types/staff";

const baseBadge = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold";

export function memberStatusBadgeClass(status: MemberStatus): string {
  switch (status) {
    case "active":    return `${baseBadge} bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300`;
    case "inactive":  return `${baseBadge} bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300`;
    case "suspended": return `${baseBadge} bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300`;
    default:          return `${baseBadge} bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300`;
  }
}

export function memberStatusLabel(status: MemberStatus): string {
  switch (status) {
    case "active":    return "Active";
    case "inactive":  return "Inactive";
    case "suspended": return "Suspended";
    default:          return status;
  }
}

export const ROLE_BADGE: Record<string, string> = {
  owner:   "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200",
  admin:   "bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-200",
  manager: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200",
  staff:   "bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-200",
  viewer:  "bg-slate-100 text-slate-800 dark:bg-slate-800/80 dark:text-slate-200",
};

export const ROLE_ICON_COLORS: Record<string, string> = {
  owner:   "text-rose-500",
  admin:   "text-violet-500",
  manager: "text-amber-500",
  staff:   "text-sky-500",
  viewer:  "text-slate-500",
};

export const ROLE_OPTIONS = [
  { value: "admin",   label: "Admin",    desc: "Full access to all modules", descBn: "সমস্ত মডিউলে পূর্ণ অ্যাক্সেস" },
  { value: "manager", label: "Manager",  desc: "Orders, products, customers, analytics", descBn: "অর্ডার, পণ্য, গ্রাহক ও বিশ্লেষণ" },
  { value: "staff",   label: "Staff",    desc: "Dashboard only (limited)", descBn: "শুধু ড্যাশবোর্ড (সীমিত)" },
  { value: "viewer",  label: "Viewer",   desc: "Read-only dashboard", descBn: "শুধু-পঠনযোগ্য ড্যাশবোর্ড" },
] as const;

export function formatLastLogin(lastLogin: string | null): string {
  if (!lastLogin) return "Never";
  const d = new Date(lastLogin);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) {
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    if (hours === 0) {
      const minutes = Math.floor(diffMs / (1000 * 60));
      return `${minutes}m ago`;
    }
    return `${hours}h ago`;
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export const AUDIT_ACTION_BADGE: Record<string, string> = {
  "member.invite":       "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  "member.role_change":  "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  "member.remove":       "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  "member.suspend":      "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  "member.activate":     "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  "invitation.cancel":   "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  "order.create":        "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  "order.update":        "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  "order.delete":        "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  "order.status_change": "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  "product.create":      "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  "product.update":      "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  "product.delete":      "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  "customer.create":     "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  "customer.update":     "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  "customer.delete":     "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  "settings.update":     "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  "subscription.change": "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
};

export function formatAuditAction(action: string): string {
  const parts = action.split(".");
  return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1).replace(/_/g, " ")).join(" > ");
}
