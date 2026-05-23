import { NextResponse, type NextRequest } from "next/server";
import { updateSupabaseSession } from "@/lib/supabase/middleware";

/** Routes that do NOT require auth */
const PUBLIC_ROUTES = ["/login", "/signup"];

/** Routes that require auth but NOT an organisation (e.g. post-signup onboarding) */
const AUTH_ONLY_ROUTES = ["/onboarding"];

/** Routes accessible even with an expired trial / past-due subscription */
const SUBSCRIPTION_BYPASS_ROUTES = ["/billing", "/unauthorized"];

/** API & checkout routes — skip org validation entirely */
const BYPASS_ORG_PREFIXES = ["/api/", "/checkout/", "/_next/", "/favicon", "/invite/"];

export async function proxy(request: NextRequest) {
  const { response, user, supabase } = await updateSupabaseSession(request);
  const { pathname } = request.nextUrl;

  // ── 1. Static / API / public checkout bypass ─────────────────────
  if (BYPASS_ORG_PREFIXES.some((p) => pathname.startsWith(p))) {
    return response;
  }

  const isPublicRoute  = PUBLIC_ROUTES.includes(pathname);
  const isAuthOnly     = AUTH_ONLY_ROUTES.includes(pathname);

  // ── 2. Unauthenticated user ───────────────────────────────────────
  if (!user) {
    if (isPublicRoute) return response;

    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search   = "";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // ── 3. Authenticated — redirect away from login/signup ───────────
  if (isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search   = "";
    return NextResponse.redirect(url);
  }

  // ── 4. Skip org check for auth-only routes (onboarding) ──────────
  if (isAuthOnly) return response;

  // ── 5. Validate workspace (organization membership) ──────────────
  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!membership) {
    const url = request.nextUrl.clone();
    url.pathname = "/onboarding";
    url.search   = "";
    return NextResponse.redirect(url);
  }

  // ── 6. Enforce Role-Based Access Control (RBAC) ───────────────────
  const role = membership.role;
  const restrictedPrefixes = ["/staff", "/settings"];

  if (restrictedPrefixes.some((p) => pathname.startsWith(p))) {
    if (role === "staff" || role === "viewer") {
      const url = request.nextUrl.clone();
      url.pathname = "/unauthorized";
      url.search   = "";
      return NextResponse.redirect(url);
    }
  }

  // ── 7. Fetch subscription status for enforcement ──────────────────
  const { data: org } = await supabase
    .from("organizations")
    .select("plan, subscription_status, trial_ends_at")
    .eq("id", membership.organization_id)
    .single();

  const plan               = org?.plan               ?? "free";
  const subscriptionStatus = org?.subscription_status ?? "active";
  const trialEndsAt        = org?.trial_ends_at       ?? new Date().toISOString();

  // ── 8. Subscription paywall enforcement ──────────────────────────
  // Billing page itself is always accessible (so they can upgrade)
  const isSubscriptionBypass = SUBSCRIPTION_BYPASS_ROUTES.some((r) =>
    pathname === r || pathname.startsWith(r + "/")
  );

  if (!isSubscriptionBypass) {
    // Block if trial expired
    if (plan === "free_trial" && new Date(trialEndsAt) < new Date()) {
      const url = request.nextUrl.clone();
      url.pathname = "/billing";
      url.search   = "";
      url.searchParams.set("reason", "trial_expired");
      return NextResponse.redirect(url);
    }

    // Block if subscription payment failed (past_due / unpaid) for paid plans
    if (
      (plan === "pro" || plan === "enterprise") &&
      (subscriptionStatus === "past_due" || subscriptionStatus === "unpaid")
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/billing";
      url.search   = "";
      url.searchParams.set("reason", "payment_required");
      return NextResponse.redirect(url);
    }
  }

  // ── 9. Inject org + subscription headers for server components ────
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-org-id",              membership.organization_id);
  requestHeaders.set("x-org-role",            membership.role);
  requestHeaders.set("x-org-plan",            plan);
  requestHeaders.set("x-subscription-status", subscriptionStatus);
  requestHeaders.set("x-trial-ends-at",       trialEndsAt);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
