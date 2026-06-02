"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseEnv } from "@/lib/env/supabase";
import type { Database } from "@/types/supabase";

let browserClient: SupabaseClient<Database> | undefined;

export function getSupabaseBrowserClient(): SupabaseClient<Database> {
  if (!browserClient) {
    browserClient = createBrowserClient<Database>(supabaseEnv.url, supabaseEnv.anonKey, {
      cookieOptions: {
        maxAge: 60 * 60 * 24 * 7,
      },
      cookies: {
        encode: "tokens-only",
      },
    });
  }

  return browserClient;
}
