import { createClient } from "@supabase/supabase-js";
import { supabaseEnv } from "@/lib/env/supabase";
import type { Database } from "@/types/supabase";

export function getSupabaseAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error("Supabase admin client must only be used on the server.");
  }

  if (!supabaseEnv.serviceRoleKey) {
    throw new Error("Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient<Database>(supabaseEnv.url, supabaseEnv.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
