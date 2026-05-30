import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseEnv } from "@/lib/env/supabase";
import type { Database } from "@/types/supabase";

const AUTH_COOKIE_PATTERN = /^sb-.+-auth-token/;

/** Maximum number of auth-token cookies before we force-purge */
const MAX_AUTH_COOKIES = 3;

export async function updateSupabaseSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // ── 1. Pre-auth: purge stale/accumulated auth cookies ────────────
  // Over time, Supabase SSR can accumulate cookie chunks from previous
  // sessions or build deployments.  If we see more than MAX_AUTH_COOKIES,
  // delete them all so getUser() starts fresh.
  const allCookies = request.cookies.getAll();
  const authCookies = allCookies.filter((c) => AUTH_COOKIE_PATTERN.test(c.name));
  const needsPurge = authCookies.length > MAX_AUTH_COOKIES;

  if (needsPurge) {
    for (const { name } of authCookies) {
      response.cookies.set(name, "", { maxAge: 0, path: "/" });
    }
  }

  // ── 2. Create SSR client with self-cleaning setAll ───────────────
  const supabase = createServerClient<Database>(supabaseEnv.url, supabaseEnv.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        const newNames = new Set(cookiesToSet.map((c) => c.name));

        // Delete any existing auth cookie NOT in the new set
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

  // ── 3. Always validate token server-side ─────────────────────────
  // getUser() ensures setAll fires on every request, keeping cookies clean.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── 4. Post-auth: enforce cookie limit (safety net) ──────────────
  const finalAuth = request
    .cookies.getAll()
    .filter((c) => AUTH_COOKIE_PATTERN.test(c.name));

  if (finalAuth.length > MAX_AUTH_COOKIES) {
    finalAuth.sort((a, b) => b.name.localeCompare(a.name));
    for (let i = 0; i < finalAuth.length - MAX_AUTH_COOKIES; i++) {
      response.cookies.set(finalAuth[i].name, "", { maxAge: 0, path: "/" });
    }
  }

  // ── 5. Debug headers (remove after verification) ─────────────────
  response.headers.set("X-Debug-Cookie-Count", String(finalAuth.length));
  response.headers.set("X-Debug-Cookie-Purge", needsPurge ? "1" : "0");

  return { response, user: user ?? null, supabase };
}
