function requiredPublicEnv(
  name: "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  raw: string | undefined,
): string {
  const value = typeof raw === "string" ? raw.trim() : "";

  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Copy .env.example to .env.local and set real values from your Supabase project (Settings → API).`,
    );
  }

  return value;
}

function requireSupabasePublicUrl(raw: string): string {
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("not http(s)");
    }
    return raw;
  } catch {
    throw new Error(
      `NEXT_PUBLIC_SUPABASE_URL must be a full URL like https://xxxx.supabase.co (got ${JSON.stringify(raw)}).`,
    );
  }
}

// Use literal `process.env.NEXT_PUBLIC_*` access so the bundler can inline values in Client Components.
// Dynamic `process.env[name]` stays empty in the browser bundle and breaks hydration.
export const supabaseEnv = {
  url: requireSupabasePublicUrl(
    requiredPublicEnv("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
  ),
  anonKey: requiredPublicEnv(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  ),
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || undefined,
};
