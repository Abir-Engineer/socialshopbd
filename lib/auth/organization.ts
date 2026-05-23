import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { WorkspaceContext, OrgRole } from "@/types/organization";
import { redirect } from "next/navigation";

/**
 * Returns the organization_id of the currently authenticated user.
 * Returns null if the user has no organisation yet (e.g. stale session).
 */
export async function getCurrentOrgId(): Promise<string | null> {
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  return data?.organization_id ?? null;
}

/**
 * Returns full workspace context (org details + role + subscription) for the current user.
 * Returns null if the user is unauthenticated or has no org.
 */
export async function getWorkspaceContext(): Promise<WorkspaceContext | null> {
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("organization_members")
    .select(`
      role,
      organization_id,
      organizations (
        id, name, slug, plan,
        subscription_status,
        trial_ends_at,
        current_period_end
      )
    `)
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!data || !data.organizations) return null;

  const org = data.organizations as {
    id: string;
    name: string;
    slug: string;
    plan: string;
    subscription_status: string;
    trial_ends_at: string;
    current_period_end: string | null;
  };

  return {
    organizationId:     org.id,
    organizationName:   org.name,
    organizationSlug:   org.slug,
    plan:               org.plan               as WorkspaceContext["plan"],
    subscriptionStatus: org.subscription_status as WorkspaceContext["subscriptionStatus"],
    trialEndsAt:        org.trial_ends_at,
    currentPeriodEnd:   org.current_period_end ?? null,
    role:               data.role              as WorkspaceContext["role"],
    userId:             user.id,
  };
}

/**
 * Returns the current org_id or redirects to /unauthorized if the user
 * has no organisation. Use inside server-side page/action guards.
 */
export async function requireOrgId(): Promise<string> {
  const orgId = await getCurrentOrgId();
  if (!orgId) redirect("/unauthorized");
  return orgId;
}

/**
 * Returns the current org_id and the user's role, or redirects to /unauthorized
 * if the user has no organisation. Use inside server-side page/action guards.
 */
export async function requireOrgIdAndRole(): Promise<{ orgId: string; role: OrgRole }> {
  const context = await getWorkspaceContext();
  if (!context) redirect("/unauthorized");
  return { orgId: context.organizationId, role: context.role };
}

/**
 * Requires an active (non-expired) subscription.
 * If the trial has expired and plan is not paid, redirects to /billing.
 * Free plan is always allowed.
 */
export async function requireActiveSubscription(): Promise<WorkspaceContext> {
  const context = await getWorkspaceContext();
  if (!context) redirect("/unauthorized");

  // Free plan is always allowed
  if (context.plan === "free") return context;

  // Active paid plans are always allowed
  if (
    (context.plan === "pro" || context.plan === "enterprise") &&
    context.subscriptionStatus === "active"
  ) {
    return context;
  }

  // Trial plan: check if expired
  if (context.plan === "free_trial") {
    const trialExpired = new Date(context.trialEndsAt) < new Date();
    if (trialExpired) redirect("/billing?reason=trial_expired");
  }

  // Past due or unpaid — redirect to billing
  if (context.subscriptionStatus === "past_due" || context.subscriptionStatus === "unpaid") {
    redirect("/billing?reason=payment_required");
  }

  return context;
}
