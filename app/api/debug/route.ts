import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  const allHeaders: Record<string, string> = {};
  const headerStore = await headers();
  headerStore.forEach((value, key) => {
    allHeaders[key] = value;
  });

  const supabase = await getSupabaseServerClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  let membership = null;
  let membershipError = null;
  let org = null;
  let orgError = null;

  if (userData?.user) {
    const memResult = await supabase
      .from("organization_members")
      .select("role, organization_id, user_id")
      .eq("user_id", userData.user.id)
      .limit(1)
      .maybeSingle();
    membership = memResult.data;
    membershipError = memResult.error;

    if (membership) {
      const orgResult = await supabase
        .from("organizations")
        .select("*")
        .eq("id", membership.organization_id)
        .maybeSingle();
      org = orgResult.data;
      orgError = orgResult.error;
    }
  }

  return NextResponse.json({
    cookies: allCookies.map(c => ({ name: c.name, value: c.value.slice(0, 50) + "..." })),
    cookieCount: allCookies.length,
    hasAuthCookie: allCookies.some(c => c.name.includes("auth-token")),
    authorizationHeader: allHeaders["authorization"] ? "present" : "absent",
    user: userData?.user
      ? { id: userData.user.id, email: userData.user.email }
      : null,
    userError: userError?.message ?? null,
    session: sessionData?.session
      ? {
          expiresAt: sessionData.session.expires_at,
          refreshToken: sessionData.session.refresh_token?.slice(0, 10) + "...",
        }
      : null,
    sessionError: sessionError?.message ?? null,
    membership,
    membershipError: membershipError?.message ?? null,
    org,
    orgError: orgError?.message ?? null,
  });
}
