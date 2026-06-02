import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseEnv } from "@/lib/env/supabase";
import type { Database } from "@/types/supabase";

const AUTH_COOKIE_PATTERN = /^sb-.+-auth-token/;

export async function updateSupabaseSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(supabaseEnv.url, supabaseEnv.anonKey, {
    cookieOptions: {
      maxAge: 60 * 60 * 24 * 7,
    },
    cookies: {
      encode: "tokens-only",
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        const newNames = new Set(cookiesToSet.map((c) => c.name));

        // Delete any existing auth cookie NOT in the new set.
        // This cleans up orphaned chunks from previous sessions/builds.
        for (const c of request.cookies.getAll()) {
          if (AUTH_COOKIE_PATTERN.test(c.name) && !newNames.has(c.name)) {
            response.cookies.set(c.name, "", { maxAge: 0, path: "/" });
          }
        }

        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });

        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // getUser() validates the token server-side, guaranteeing setAll fires
  // on every request.  The self-cleaning logic above then deletes any
  // stale cookie chunks that have accumulated from previous sessions.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Safety net: clean up any leftover stale cookies.
  const finalAuth = request
    .cookies.getAll()
    .filter((c) => AUTH_COOKIE_PATTERN.test(c.name));

  if (!user && finalAuth.length > 0) {
    // No valid session — delete all leftover auth cookies
    for (const { name } of finalAuth) {
      response.cookies.set(name, "", { maxAge: 0, path: "/" });
    }
  } else if (user && finalAuth.length > 3) {
    // Valid session but too many cookie chunks — trim extras
    const sorted = [...finalAuth].sort((a, b) => a.name.localeCompare(b.name));
    const extras = sorted.slice(0, sorted.length - 3);
    for (const { name } of extras) {
      response.cookies.set(name, "", { maxAge: 0, path: "/" });
    }
  }

  return { response, user: user ?? null, supabase };
}
