"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { requireOrgIdAndRole } from "@/lib/auth/organization";
import type { OrgRole } from "@/types/organization";

export type StaffActionResult = { ok: true } | { ok: false; error: string };

const VALID_ROLES = ["admin", "staff", "viewer"] as const;

function isValidRole(value: string): value is (typeof VALID_ROLES)[number] {
  return (VALID_ROLES as readonly string[]).includes(value);
}

export async function inviteStaffMember(formData: FormData): Promise<StaffActionResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "").trim().toLowerCase();

  if (!email) return { ok: false, error: "Email is required." };
  if (!isValidRole(role)) return { ok: false, error: "Role must be admin, staff, or viewer." };

  // Get current workspace context and user role
  let orgId: string;
  let callerRole: OrgRole;
  try {
    const context = await requireOrgIdAndRole();
    orgId = context.orgId;
    callerRole = context.role;
  } catch {
    return { ok: false, error: "Unauthorized. Workspace not found." };
  }

  // Only Owner and Admin can invite members
  if (callerRole !== "owner" && callerRole !== "admin") {
    return { ok: false, error: "Unauthorized. Only owners and admins can invite members." };
  }

  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Unauthorized. Please log in again." };

  const { error } = await supabase.from("organization_invitations").insert({
    organization_id: orgId,
    email,
    role,
    invited_by: user.id,
    status: "pending",
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "A pending invitation for this email already exists." };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/staff");
  return { ok: true };
}

export async function cancelInvitation(id: string): Promise<StaffActionResult> {
  if (!id?.trim()) return { ok: false, error: "Missing invitation ID." };

  let callerRole: OrgRole;
  try {
    const context = await requireOrgIdAndRole();
    callerRole = context.role;
  } catch {
    return { ok: false, error: "Unauthorized. Workspace not found." };
  }

  if (callerRole !== "owner" && callerRole !== "admin") {
    return { ok: false, error: "Unauthorized. Only owners and admins can cancel invitations." };
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.from("organization_invitations").delete().eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/staff");
  return { ok: true };
}

export async function updateStaffMember(formData: FormData): Promise<StaffActionResult> {
  const id = String(formData.get("id") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim().toLowerCase();

  if (!id) return { ok: false, error: "Missing membership ID." };
  if (!isValidRole(role)) return { ok: false, error: "Role must be admin, staff, or viewer." };

  let callerRole: OrgRole;
  try {
    const context = await requireOrgIdAndRole();
    callerRole = context.role;
  } catch {
    return { ok: false, error: "Unauthorized. Workspace not found." };
  }

  if (callerRole !== "owner" && callerRole !== "admin") {
    return { ok: false, error: "Unauthorized. Only owners and admins can change roles." };
  }

  const supabase = await getSupabaseServerClient();

  // Fetch the target member first to ensure hierarchy rules
  const { data: target, error: fetchError } = await supabase
    .from("organization_members")
    .select("role, user_id")
    .eq("id", id)
    .single();

  if (fetchError || !target) {
    return { ok: false, error: "Target team member not found." };
  }

  // Hierarchical guard rails:
  // 1. Cannot modify owner's role
  if (target.role === "owner") {
    return { ok: false, error: "Cannot change the organization owner's role." };
  }

  // 2. Admins cannot modify other admins
  if (callerRole === "admin" && target.role === "admin") {
    const { data: { user } } = await supabase.auth.getUser();
    if (user && user.id !== target.user_id) {
      return { ok: false, error: "Admins cannot change roles of other admins." };
    }
  }

  const { error } = await supabase
    .from("organization_members")
    .update({ role })
    .eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/staff");
  return { ok: true };
}

export async function deleteStaffMember(id: string): Promise<StaffActionResult> {
  if (!id?.trim()) return { ok: false, error: "Missing membership ID." };

  let callerRole: OrgRole;
  try {
    const context = await requireOrgIdAndRole();
    callerRole = context.role;
  } catch {
    return { ok: false, error: "Unauthorized. Workspace not found." };
  }

  if (callerRole !== "owner" && callerRole !== "admin") {
    return { ok: false, error: "Unauthorized. Only owners and admins can remove members." };
  }

  const supabase = await getSupabaseServerClient();

  // Fetch the target member first
  const { data: target, error: fetchError } = await supabase
    .from("organization_members")
    .select("role, user_id")
    .eq("id", id)
    .single();

  if (fetchError || !target) {
    return { ok: false, error: "Target team member not found." };
  }

  // Hierarchical guard rails:
  // 1. Cannot remove organization owner
  if (target.role === "owner") {
    return { ok: false, error: "Cannot remove the organization owner." };
  }

  // 2. Cannot remove yourself (should use a dedicated leave workspace flow)
  const { data: { user } } = await supabase.auth.getUser();
  if (user && user.id === target.user_id) {
    return { ok: false, error: "You cannot remove yourself from the workspace." };
  }

  // 3. Admins cannot remove other admins
  if (callerRole === "admin" && target.role === "admin") {
    return { ok: false, error: "Admins cannot remove other admins." };
  }

  const { error } = await supabase.from("organization_members").delete().eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/staff");
  return { ok: true };
}
