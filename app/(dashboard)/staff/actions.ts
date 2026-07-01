"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { requireOrgIdAndRole } from "@/lib/auth/organization";
import { insertAuditLog } from "@/lib/staff/service";
import type { OrgRole } from "@/types/organization";

export type StaffActionResult = { ok: true } | { ok: false; error: string };

const VALID_ROLES = ["admin", "manager", "staff", "viewer"] as const;

function isValidRole(value: string): value is (typeof VALID_ROLES)[number] {
  return (VALID_ROLES as readonly string[]).includes(value);
}

export async function inviteStaffMember(formData: FormData): Promise<StaffActionResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "").trim().toLowerCase();

  if (!email) return { ok: false, error: "Email is required." };
  if (!isValidRole(role)) return { ok: false, error: "Role must be admin, manager, staff, or viewer." };

  let orgId: string;
  let callerRole: OrgRole;
  try {
    const context = await requireOrgIdAndRole();
    orgId = context.orgId;
    callerRole = context.role;
  } catch {
    return { ok: false, error: "Unauthorized. Workspace not found." };
  }

  if (callerRole !== "owner" && callerRole !== "admin") {
    return { ok: false, error: "Unauthorized. Only owners and admins can invite members." };
  }

  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Unauthorized. Please log in again." };

  const { data: invitation, error } = await supabase
    .from("organization_invitations")
    .insert({
      organization_id: orgId,
      email,
      role,
      invited_by: user.id,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "A pending invitation for this email already exists." };
    }
    return { ok: false, error: error.message };
  }

  // Audit log
  await insertAuditLog(supabase, {
    organization_id: orgId,
    actor_id: user.id,
    action: "member.invite",
    target_type: "organization_members",
    target_id: email,
    details: { role, invitation_id: invitation?.id },
  });

  revalidatePath("/staff");
  return { ok: true };
}

export async function cancelInvitation(id: string): Promise<StaffActionResult> {
  if (!id?.trim()) return { ok: false, error: "Missing invitation ID." };

  let callerRole: OrgRole;
  let orgId: string;
  try {
    const context = await requireOrgIdAndRole();
    orgId = context.orgId;
    callerRole = context.role;
  } catch {
    return { ok: false, error: "Unauthorized. Workspace not found." };
  }

  if (callerRole !== "owner" && callerRole !== "admin") {
    return { ok: false, error: "Unauthorized. Only owners and admins can cancel invitations." };
  }

  const supabase = await getSupabaseServerClient();

  // Fetch invitation before deleting for audit
  const { data: inv } = await supabase
    .from("organization_invitations")
    .select("email, role")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("organization_invitations").delete().eq("id", id);

  if (error) return { ok: false, error: error.message };

  const { data: { user } } = await supabase.auth.getUser();
  if (user && inv) {
    await insertAuditLog(supabase, {
      organization_id: orgId,
      actor_id: user.id,
      action: "invitation.cancel",
      target_type: "organization_invitations",
      target_id: id,
      details: { email: inv.email, role: inv.role },
    });
  }

  revalidatePath("/staff");
  return { ok: true };
}

export async function updateStaffMember(formData: FormData): Promise<StaffActionResult> {
  const id = String(formData.get("id") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim().toLowerCase();

  if (!id) return { ok: false, error: "Missing membership ID." };
  if (!isValidRole(role)) return { ok: false, error: "Role must be admin, manager, staff, or viewer." };

  let callerRole: OrgRole;
  let orgId: string;
  try {
    const context = await requireOrgIdAndRole();
    orgId = context.orgId;
    callerRole = context.role;
  } catch {
    return { ok: false, error: "Unauthorized. Workspace not found." };
  }

  if (callerRole !== "owner" && callerRole !== "admin") {
    return { ok: false, error: "Unauthorized. Only owners and admins can change roles." };
  }

  const supabase = await getSupabaseServerClient();

  const { data: target, error: fetchError } = await supabase
    .from("organization_members")
    .select("role, user_id")
    .eq("id", id)
    .single();

  if (fetchError || !target) return { ok: false, error: "Target team member not found." };

  if (target.role === "owner") return { ok: false, error: "Cannot change the organization owner's role." };

  if (callerRole === "admin" && target.role === "admin") {
    const { data: { user } } = await supabase.auth.getUser();
    if (user && user.id !== target.user_id) {
      return { ok: false, error: "Admins cannot change roles of other admins." };
    }
  }

  const { error } = await supabase.from("organization_members").update({ role }).eq("id", id);

  if (error) return { ok: false, error: error.message };

  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await insertAuditLog(supabase, {
      organization_id: orgId,
      actor_id: user.id,
      action: "member.role_change",
      target_type: "organization_members",
      target_id: id,
      details: { from_role: target.role, to_role: role },
    });
  }

  revalidatePath("/staff");
  return { ok: true };
}

export async function deleteStaffMember(id: string): Promise<StaffActionResult> {
  if (!id?.trim()) return { ok: false, error: "Missing membership ID." };

  let callerRole: OrgRole;
  let orgId: string;
  try {
    const context = await requireOrgIdAndRole();
    orgId = context.orgId;
    callerRole = context.role;
  } catch {
    return { ok: false, error: "Unauthorized. Workspace not found." };
  }

  if (callerRole !== "owner" && callerRole !== "admin") {
    return { ok: false, error: "Unauthorized. Only owners and admins can remove members." };
  }

  const supabase = await getSupabaseServerClient();

  const { data: target, error: fetchError } = await supabase
    .from("organization_members")
    .select("role, user_id")
    .eq("id", id)
    .single();

  if (fetchError || !target) return { ok: false, error: "Target team member not found." };

  if (target.role === "owner") return { ok: false, error: "Cannot remove the organization owner." };

  const { data: { user } } = await supabase.auth.getUser();
  if (user && user.id === target.user_id) {
    return { ok: false, error: "You cannot remove yourself from the workspace." };
  }

  if (callerRole === "admin" && target.role === "admin") {
    return { ok: false, error: "Admins cannot remove other admins." };
  }

  const { error } = await supabase.from("organization_members").delete().eq("id", id);

  if (error) return { ok: false, error: error.message };

  if (user) {
    await insertAuditLog(supabase, {
      organization_id: orgId,
      actor_id: user.id,
      action: "member.remove",
      target_type: "organization_members",
      target_id: id,
      details: { removed_user_id: target.user_id },
    });
  }

  revalidatePath("/staff");
  return { ok: true };
}

export async function updateMemberStatus(
  memberId: string,
  status: "active" | "inactive" | "suspended",
): Promise<StaffActionResult> {
  if (!memberId?.trim()) return { ok: false, error: "Missing member ID." };
  if (!["active", "inactive", "suspended"].includes(status)) {
    return { ok: false, error: "Status must be active, inactive, or suspended." };
  }

  let callerRole: OrgRole;
  let orgId: string;
  try {
    const context = await requireOrgIdAndRole();
    orgId = context.orgId;
    callerRole = context.role;
  } catch {
    return { ok: false, error: "Unauthorized. Workspace not found." };
  }

  if (callerRole !== "owner" && callerRole !== "admin") {
    return { ok: false, error: "Unauthorized. Only owners and admins can change member status." };
  }

  const supabase = await getSupabaseServerClient();

  const { data: target } = await supabase
    .from("organization_members")
    .select("role, user_id")
    .eq("id", memberId)
    .single();

  if (!target) return { ok: false, error: "Member not found." };
  if (target.role === "owner") return { ok: false, error: "Cannot change the owner's status." };

  const { error } = await supabase
    .from("organization_members")
    .update({ status })
    .eq("id", memberId);

  if (error) return { ok: false, error: error.message };

  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const action = status === "suspended" ? "member.suspend" : "member.activate";
    await insertAuditLog(supabase, {
      organization_id: orgId,
      actor_id: user.id,
      action,
      target_type: "organization_members",
      target_id: memberId,
      details: { new_status: status },
    });
  }

  revalidatePath("/staff");
  return { ok: true };
}
