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
    .maybeSingle();

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
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error("getWorkspaceContext: getUser error", userError);
  }

  if (!user) return null;

  // First query: get the org membership
  const { data: membership, error: memberErr } = await supabase
    .from("organization_members")
    .select("role, organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (memberErr) {
    console.error("getWorkspaceContext: membership query error", memberErr);
  }

  if (!membership) return null;

  // Second query: get org details
  const { data: org, error: orgErr } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", membership.organization_id)
    .maybeSingle();

  if (orgErr) {
    console.error("getWorkspaceContext: org query error", orgErr);
  }

  if (!org) return null;

  return {
    organizationId:     org.id,
    organizationName:   org.name,
    organizationSlug:   org.slug,
    plan:               (org.plan ?? "free")   as WorkspaceContext["plan"],
    subscriptionStatus: (org.subscription_status ?? "active") as WorkspaceContext["subscriptionStatus"],
    trialEndsAt:        org.trial_ends_at,
    currentPeriodEnd:   org.current_period_end ?? null,
    role:               membership.role        as WorkspaceContext["role"],
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
