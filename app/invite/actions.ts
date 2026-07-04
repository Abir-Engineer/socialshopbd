"use server";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { supabaseEnv } from "@/lib/env/supabase";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function getSupabaseServiceRoleClient() {
  const cookieStore = await cookies();
  if (!supabaseEnv.serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable.");
  }
  return createServerClient(supabaseEnv.url, supabaseEnv.serviceRoleKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components can read cookies but may not set them.
        }
      },
    },
  });
}

export type InviteActionResult = { ok: true } | { ok: false; error: string };

export async function acceptInvitation(token: string): Promise<InviteActionResult> {
  if (!token?.trim()) {
    return { ok: false, error: "This invitation link is invalid." };
  }

  // 1. Get current logged in user
  const userSupabase = await getSupabaseServerClient();
  const { data: { user }, error: authError } = await userSupabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: "Please log in to accept this invitation." };
  }

  // 2. Fetch invitation details using service role (to ensure read access and write permissions)
  const serviceSupabase = await getSupabaseServiceRoleClient();
  
  const { data: invite, error: inviteError } = await serviceSupabase
    .from("organization_invitations")
    .select("*")
    .eq("token", token)
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (inviteError || !invite) {
    return { ok: false, error: "This invitation has expired or is no longer valid." };
  }

  // 3. Security: ensure the user's email matches the invited email
  if (user.email?.toLowerCase() !== invite.email.toLowerCase()) {
    return { 
      ok: false, 
      error: `This invitation was sent to ${invite.email}, but you are logged in as ${user.email}.` 
    };
  }

  // 4. Perform the transition in a single safe sequence
  // Delete any existing memberships in that organization to prevent conflict
  await serviceSupabase
    .from("organization_members")
    .delete()
    .eq("organization_id", invite.organization_id)
    .eq("user_id", user.id);

  // Insert the new membership
  const { error: insertError } = await serviceSupabase
    .from("organization_members")
    .insert({
      organization_id: invite.organization_id,
      user_id: user.id,
      role: invite.role,
    });

  if (insertError) {
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  // Mark invitation as accepted
  const { error: updateError } = await serviceSupabase
    .from("organization_invitations")
    .update({ status: "accepted" })
    .eq("id", invite.id);

  if (updateError) {
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  return { ok: true };
}
