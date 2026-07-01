import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/supabase";
import type { ShopData, Theme, Locale } from "@/types/settings";

export async function fetchShop(supabase: SupabaseClient<Database>, userId: string) {
  const { data } = await supabase
    .from("shops")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return data as Record<string, unknown> | null;
}

export async function upsertShop(supabase: SupabaseClient<Database>, userId: string, data: Partial<ShopData>) {
  const payload: Record<string, unknown> = { user_id: userId, updated_at: new Date().toISOString() };
  if (data.shop_name !== undefined) payload.shop_name = data.shop_name;
  if (data.slug !== undefined) payload.slug = data.slug;
  if (data.description !== undefined) payload.description = data.description;
  if (data.currency !== undefined) payload.currency = data.currency;
  if (data.phone !== undefined) payload.phone = data.phone;
  if (data.address !== undefined) payload.address = data.address;
  if (data.logo_url !== undefined) payload.logo_url = data.logo_url;
  if (data.invoice_prefix !== undefined) payload.invoice_prefix = data.invoice_prefix;
  if (data.default_courier !== undefined) payload.default_courier = data.default_courier;
  const { error } = await supabase.from("shops").upsert(payload as never, { onConflict: "user_id" });
  return { error };
}

export async function fetchOrgSetting(supabase: SupabaseClient<Database>, orgId: string, key: string): Promise<Json | null> {
  const { data } = await supabase
    .from("org_settings")
    .select("value")
    .eq("organization_id", orgId)
    .eq("key", key)
    .maybeSingle();
  return data?.value ?? null;
}

export async function upsertOrgSetting(
  supabase: SupabaseClient<Database>,
  orgId: string,
  key: string,
  value: Json,
) {
  const { error } = await supabase.from("org_settings").upsert(
    { organization_id: orgId, key, value, updated_at: new Date().toISOString() },
    { onConflict: "organization_id, key" },
  );
  return { error };
}

export async function updateOrgTheme(
  supabase: SupabaseClient<Database>,
  orgId: string,
  theme: Theme,
  locale: Locale,
) {
  const { error } = await supabase
    .from("organizations")
    .update({ theme, locale, updated_at: new Date().toISOString() })
    .eq("id", orgId);
  return { error };
}

export async function fetchNotificationPrefs(
  supabase: SupabaseClient<Database>,
  orgId: string,
) {
  const { data } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("organization_id", orgId)
    .maybeSingle();
  return data;
}

export async function upsertNotificationPrefs(
  supabase: SupabaseClient<Database>,
  orgId: string,
  prefs: Record<string, boolean>,
) {
  const { error } = await supabase.from("notification_preferences").upsert(
    { organization_id: orgId, ...prefs, updated_at: new Date().toISOString() },
    { onConflict: "organization_id" },
  );
  return { error };
}
