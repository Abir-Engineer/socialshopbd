"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export type OnboardingResult = { ok: true } | { ok: false; error: string };

async function insertMembership(organization_id: string, user_id: string) {
  let adminClient: ReturnType<typeof getSupabaseAdminClient> | null = null;
  try {
    adminClient = getSupabaseAdminClient();
  } catch {
    // Service role key not available — fall back to user client (RLS must allow it)
  }

  const client = adminClient ?? await getSupabaseServerClient();

  const { error } = await client
    .from("organization_members")
    .insert({ organization_id, user_id, role: "owner" });

  return error;
}

export async function createOrganization(formData: FormData): Promise<OnboardingResult> {
  try {
    const name = String(formData.get("name") ?? "").trim();
    if (!name) return { ok: false, error: "Please enter an organization name." };

    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "You don't have permission to perform this action." };

    // ── Check if user already owns an org ──
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

      // Check if membership already exists before inserting (avoid duplicate)
      const { data: existingMembership } = await supabase
        .from("organization_members")
        .select("id")
        .eq("user_id", user.id)
        .eq("organization_id", existingOrg.id)
        .maybeSingle();

      if (!existingMembership) {
        const error = await insertMembership(existingOrg.id, user.id);
        if (error) return { ok: false, error: "Something went wrong. Please try again." };
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
        return { ok: false, error: "This organization name is already taken. Please try another." };
      }
      return { ok: false, error: "Something went wrong. Please try again." };
    }

    const error = await insertMembership(org.id, user.id);
    if (error) return { ok: false, error: "Something went wrong. Please try again." };

    revalidatePath("/");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
