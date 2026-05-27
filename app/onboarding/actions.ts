"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type OnboardingResult = { ok: true } | { ok: false; error: string };

export async function createOrganization(formData: FormData): Promise<OnboardingResult> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { ok: false, error: "Organization name is required." };

  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Unauthorized." };

  // ── Check if user already owns an org (signup trigger may have created one) ──
  const { data: existingOrg } = await supabase
    .from("organizations")
    .select("id, name")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (existingOrg) {
    if (existingOrg.name !== name) {
      await supabase
        .from("organizations")
        .update({ name })
        .eq("id", existingOrg.id);
    }

    const { error: memberError } = await supabase
      .from("organization_members")
      .insert({ organization_id: existingOrg.id, user_id: user.id, role: "owner" });

    if (memberError && memberError.code !== "23505") {
      return { ok: false, error: memberError.message };
    }

    revalidatePath("/");
    return { ok: true };
  }

  // ── Check if user already has a membership (should not happen, but be safe) ──
  const { data: existingMembership } = await supabase
    .from("organization_members")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingMembership) {
    revalidatePath("/");
    return { ok: true };
  }

  // ── Generate unique slug with collision avoidance ──
  let slug = "org-" + user.id.slice(0, 8);

  const { data: slugExists } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (slugExists) {
    slug = "org-" + user.id.slice(0, 8) + "-" + crypto.randomUUID().slice(0, 4);
  }

  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({ name, slug, owner_id: user.id })
    .select("id")
    .single();

  if (orgError) {
    if (orgError.code === "23505") {
      return { ok: false, error: "An organization with this slug already exists. Please try again." };
    }
    return { ok: false, error: orgError.message };
  }

  const { error: memberError } = await supabase
    .from("organization_members")
    .insert({ organization_id: org.id, user_id: user.id, role: "owner" });

  if (memberError) {
    return { ok: false, error: memberError.message };
  }

  revalidatePath("/");
  return { ok: true };
}
