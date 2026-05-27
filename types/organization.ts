export type OrgRole = "owner" | "admin" | "manager" | "staff" | "viewer";
export type OrgPlan = "free_trial" | "free" | "pro" | "enterprise";
export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "canceled"
  | "past_due"
  | "unpaid"
  | "incomplete";

export type PaymentProvider = "stripe" | "sslcommerz" | "manual" | "none";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  owner_id: string | null;
  plan: OrgPlan;
  subscription_status: SubscriptionStatus;
  trial_ends_at: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  billing_email: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrgRole;
  created_at: string;
}

export interface OrgUsage {
  ordersTotal: number;
  productsTotal: number;
  customersTotal: number;
  staffTotal: number;
  ordersThisMonth: number;
}

/** Lightweight view of the current user's workspace membership */
export interface WorkspaceContext {
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  plan: OrgPlan;
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt: string;
  currentPeriodEnd: string | null;
  role: OrgRole;
  userId: string;
}
