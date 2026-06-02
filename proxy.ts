import { NextResponse, type NextRequest } from "next/server";
import { updateSupabaseSession } from "@/lib/supabase/middleware";
import { canAccessModule } from "@/lib/permissions";
import type { PermissionModule } from "@/lib/permissions";

const PUBLIC_ROUTES = ["/login", "/signup"];
const AUTH_ONLY_ROUTES = ["/onboarding"];
const SUBSCRIPTION_BYPASS_ROUTES = ["/billing", "/unauthorized"];
const BYPASS_ORG_PREFIXES = ["/api/", "/checkout/", "/_next/", "/favicon", "/invite/"];

const PATH_MODULE_MAP: [string, PermissionModule][] = [
  ["/dashboard", "dashboard"],
  ["/orders", "orders"],
  ["/products", "products"],
  ["/customers", "customers"],
  ["/analytics", "analytics"],
  ["/staff", "staff"],
  ["/settings", "settings"],
  ["/billing", "billing"],
];

function applySessionData(source: NextResponse, target: NextResponse) {
  for (const { name, value, ...rest } of source.cookies.getAll()) {
    target.cookies.set(name, value, rest);
  }
}

export async function proxy(request: NextRequest) {
  const { response, user, supabase } = await updateSupabaseSession(request);
  const { pathname } = request.nextUrl;

  // Landing page is always public
  if (pathname === "/") {
    return response;
  }

  if (BYPASS_ORG_PREFIXES.some((p) => pathname.startsWith(p))) {
    return response;
  }

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  const isAuthOnly = AUTH_ONLY_ROUTES.includes(pathname);

  if (!user) {
    if (isPublicRoute) return response;

    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", pathname);
    const redirect = NextResponse.redirect(url);
    applySessionData(response, redirect);
    return redirect;
  }

  if (isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    const redirect = NextResponse.redirect(url);
    applySessionData(response, redirect);
    return redirect;
  }

  if (isAuthOnly) return response;

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!membership) {
    const url = request.nextUrl.clone();
    url.pathname = "/onboarding";
    url.search = "";
    const redirect = NextResponse.redirect(url);
    applySessionData(response, redirect);
    return redirect;
  }

  const role = membership.role;

  for (const [prefix, mod] of PATH_MODULE_MAP) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) {
      if (!canAccessModule(role, mod)) {
        const url = request.nextUrl.clone();
        url.pathname = "/unauthorized";
        url.search = "";
        const redirect = NextResponse.redirect(url);
        applySessionData(response, redirect);
        return redirect;
      }
      break;
    }
  }

  const { data: org } = await supabase
    .from("organizations")
    .select("plan, subscription_status, trial_ends_at")
    .eq("id", membership.organization_id)
    .single();

  const plan = org?.plan ?? "free";
  const subscriptionStatus = org?.subscription_status ?? "active";
  const trialEndsAt = org?.trial_ends_at ?? new Date().toISOString();

  const isSubscriptionBypass = SUBSCRIPTION_BYPASS_ROUTES.some((r) =>
    pathname === r || pathname.startsWith(r + "/")
  );

  if (!isSubscriptionBypass) {
    if (plan === "free_trial" && new Date(trialEndsAt) < new Date()) {
      const url = request.nextUrl.clone();
      url.pathname = "/billing";
      url.search = "";
      url.searchParams.set("reason", "trial_expired");
      const redirect = NextResponse.redirect(url);
      applySessionData(response, redirect);
      return redirect;
    }

    if (
      (plan === "pro" || plan === "enterprise") &&
      (subscriptionStatus === "past_due" || subscriptionStatus === "unpaid")
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/billing";
      url.search = "";
      url.searchParams.set("reason", "payment_required");
      const redirect = NextResponse.redirect(url);
      applySessionData(response, redirect);
      return redirect;
    }
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-org-id", membership.organization_id);
  requestHeaders.set("x-org-role", membership.role);
  requestHeaders.set("x-org-plan", plan);
  requestHeaders.set("x-subscription-status", subscriptionStatus);
  requestHeaders.set("x-trial-ends-at", trialEndsAt);

  const nextResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });
  applySessionData(response, nextResponse);
  return nextResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|login|signup|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
