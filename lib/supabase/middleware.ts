import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseEnv } from "@/lib/env/supabase";
import type { Database } from "@/types/supabase";

const isSupabaseAuthCookie = (name: string) =>
  name.startsWith("sb-") && name.includes("auth-token");

export async function updateSupabaseSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(supabaseEnv.url, supabaseEnv.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        const newNames = new Set(cookiesToSet.map((c) => c.name));

        const staleCookies = request
          .cookies.getAll()
          .filter((c) => isSupabaseAuthCookie(c.name) && !newNames.has(c.name));

        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));

        response = NextResponse.next({ request });

        for (const { name } of staleCookies) {
          response.cookies.set(name, "", { maxAge: 0, path: "/" });
        }
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return { response, user: session?.user ?? null, supabase };
}
