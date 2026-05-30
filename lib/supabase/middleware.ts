import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseEnv } from "@/lib/env/supabase";
import type { Database } from "@/types/supabase";

const AUTH_COOKIE_PATTERN = /^sb-.+-auth-token/;

export async function updateSupabaseSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(supabaseEnv.url, supabaseEnv.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        const newNames = new Set(cookiesToSet.map((c) => c.name));

        // Collect stale auth cookie names before mutating request
        const staleNames: string[] = [];
        for (const c of request.cookies.getAll()) {
          if (AUTH_COOKIE_PATTERN.test(c.name) && !newNames.has(c.name)) {
            staleNames.push(c.name);
          }
        }

        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });

        // Delete stale cookies on the new response
        for (const name of staleNames) {
          response.cookies.set(name, "", { maxAge: 0, path: "/" });
        }

        // Set fresh cookies from Supabase
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // getUser() validates the token server-side, which guarantees setAll
  // runs on every request and prunes stale cookie chunks, preventing
  // the unbounded accumulation that causes 494 REQUEST_HEADER_TOO_LARGE.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user: user ?? null, supabase };
}
