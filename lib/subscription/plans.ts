import type { OrgPlan } from "@/types/organization";

// ─────────────────────────────────────────────────────────────────────────────
// Plan limit definitions
// ─────────────────────────────────────────────────────────────────────────────

export interface PlanLimits {
  orders_per_month: number | null;   // null = unlimited
  products_total: number | null;
  customers_total: number | null;
  staff_members: number | null;
}

export interface PlanFeatureFlags {
  courier_dispatch: boolean;
  advanced_analytics: boolean;
  ai_features: boolean;
  multi_staff: boolean;           // >1 staff member
  export_data: boolean;
  priority_support: boolean;
}

export interface PlanDetails {
  id: OrgPlan;
  name: string;
  tagline: string;
  price_bdt: number | null;     // Monthly price in BDT, null = free
  price_usd: number | null;     // Monthly price in USD, null = free
  badge_color: string;
  limits: PlanLimits;
  features: PlanFeatureFlags;
  is_popular: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Plan data
// ─────────────────────────────────────────────────────────────────────────────

export const PLAN_DETAILS: Record<OrgPlan, PlanDetails> = {
  free_trial: {
    id: "free_trial",
    name: "Free Trial",
    tagline: "Try everything for 14 days",
    price_bdt: null,
    price_usd: null,
    badge_color: "bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-300",
    limits: {
      orders_per_month: null,
      products_total: null,
      customers_total: null,
      staff_members: null,
    },
    features: {
      courier_dispatch: true,
      advanced_analytics: true,
      ai_features: false,
      multi_staff: true,
      export_data: true,
      priority_support: false,
    },
    is_popular: false,
  },

  free: {
    id: "free",
    name: "Free",
    tagline: "For small shops just getting started",
    price_bdt: null,
    price_usd: null,
    badge_color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    limits: {
      orders_per_month: 50,
      products_total: 20,
      customers_total: 50,
      staff_members: 1,
    },
    features: {
      courier_dispatch: false,
      advanced_analytics: false,
      ai_features: false,
      multi_staff: false,
      export_data: false,
      priority_support: false,
    },
    is_popular: false,
  },

  pro: {
    id: "pro",
    name: "Pro",
    tagline: "Unlimited power for growing businesses",
    price_bdt: 999,
    price_usd: 9,
    badge_color: "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300",
    limits: {
      orders_per_month: null,
      products_total: null,
      customers_total: null,
      staff_members: 10,
    },
    features: {
      courier_dispatch: true,
      advanced_analytics: true,
      ai_features: true,
      multi_staff: true,
      export_data: true,
      priority_support: true,
    },
    is_popular: true,
  },

  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    tagline: "Custom solutions for large organizations",
    price_bdt: null,
    price_usd: null,
    badge_color: "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300",
    limits: {
      orders_per_month: null,
      products_total: null,
      customers_total: null,
      staff_members: null,
    },
    features: {
      courier_dispatch: true,
      advanced_analytics: true,
      ai_features: true,
      multi_staff: true,
      export_data: true,
      priority_support: true,
    },
    is_popular: false,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Utility functions
// ─────────────────────────────────────────────────────────────────────────────

export function isFeatureAllowed(
  plan: OrgPlan,
  feature: keyof PlanFeatureFlags
): boolean {
  return PLAN_DETAILS[plan]?.features[feature] ?? false;
}

export function getPlanLimits(plan: OrgPlan): PlanLimits {
  return PLAN_DETAILS[plan]?.limits ?? PLAN_DETAILS.free.limits;
}

export function isWithinLimit(
  plan: OrgPlan,
  resource: keyof PlanLimits,
  currentCount: number
): boolean {
  const limit = getPlanLimits(plan)[resource];
  if (limit === null) return true; // null = unlimited
  return currentCount < limit;
}

export function isAtLimit(
  plan: OrgPlan,
  resource: keyof PlanLimits,
  currentCount: number
): boolean {
  return !isWithinLimit(plan, resource, currentCount);
}

export function getLimitValue(plan: OrgPlan, resource: keyof PlanLimits): number | null {
  return getPlanLimits(plan)[resource];
}

export function formatLimit(limit: number | null): string {
  return limit === null ? "Unlimited" : limit.toLocaleString("en-BD");
}

export function formatPlanPrice(plan: OrgPlan, currency: "bdt" | "usd" = "bdt"): string {
  const details = PLAN_DETAILS[plan];
  if (!details) return "Free";
  if (currency === "bdt") {
    return details.price_bdt === null ? "Free" : `৳${details.price_bdt.toLocaleString("en-BD")}/mo`;
  }
  return details.price_usd === null ? "Free" : `$${details.price_usd}/mo`;
}

// Feature display metadata for the upgrade prompt
export const FEATURE_DESCRIPTIONS: Record<keyof PlanFeatureFlags, { label: string; description: string }> = {
  courier_dispatch: {
    label: "Courier Dispatch",
    description: "Book Steadfast & Pathao couriers and send SMS notifications directly from orders.",
  },
  advanced_analytics: {
    label: "Advanced Analytics",
    description: "Revenue trends, top products, customer retention, and full growth insights.",
  },
  ai_features: {
    label: "AI Assistant",
    description: "AI-powered order insights, inventory suggestions, and automated reporting.",
  },
  multi_staff: {
    label: "Team Management",
    description: "Invite multiple staff members with role-based access control.",
  },
  export_data: {
    label: "Data Export",
    description: "Export your orders, products, and customers as CSV or Excel files.",
  },
  priority_support: {
    label: "Priority Support",
    description: "Get faster response times with dedicated priority support.",
  },
};
