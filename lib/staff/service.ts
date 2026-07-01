import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/supabase";
import type { StaffMember, AuditLogEntry, ActivityLogEntry, StaffStats } from "@/types/staff";

export async function fetchStaffMembers(
  supabase: SupabaseClient<Database>,
  orgId: string,
): Promise<StaffMember[]> {
  const { data, error } = await supabase.rpc("get_organization_members", {
    org_id: orgId,
  });
  if (error) return [];
  return (data ?? []) as StaffMember[];
}

export async function fetchAuditLogs(
  supabase: SupabaseClient<Database>,
  orgId: string,
  limit = 50,
): Promise<AuditLogEntry[]> {
  const { data, error } = await supabase
    .from("audit_logs")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []) as AuditLogEntry[];
}

export async function fetchActivityLogs(
  supabase: SupabaseClient<Database>,
  orgId: string,
  userId?: string,
  limit = 50,
): Promise<ActivityLogEntry[]> {
  let query = supabase
    .from("activity_logs")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (userId) query = query.eq("user_id", userId);
  const { data, error } = await query;
  if (error) return [];
  return (data ?? []) as ActivityLogEntry[];
}

export async function insertAuditLog(
  supabase: SupabaseClient<Database>,
  params: {
    organization_id: string;
    actor_id: string;
    action: string;
    target_type: string;
    target_id: string;
    details?: Json;
  },
) {
  const { error } = await supabase.from("audit_logs").insert(params as never);
  if (error) console.error("audit_log insert error:", error);
}

export async function insertActivityLog(
  supabase: SupabaseClient<Database>,
  params: {
    organization_id: string;
    user_id: string;
    activity_type: string;
    description: string;
    metadata?: Json;
  },
) {
  const { error } = await supabase.from("activity_logs").insert(params as never);
  if (error) console.error("activity_log insert error:", error);
}

export function computeStaffStats(members: StaffMember[]): StaffStats {
  return {
    total: members.length,
    active: members.filter((m) => m.status === "active").length,
    inactive: members.filter((m) => m.status === "inactive").length,
    suspended: members.filter((m) => m.status === "suspended").length,
    byRole: members.reduce<Record<string, number>>((acc, m) => {
      acc[m.role] = (acc[m.role] ?? 0) + 1;
      return acc;
    }, {}),
  };
}

export function applyStaffFilters(
  members: StaffMember[],
  filters: { search?: string; role?: string; status?: string },
): StaffMember[] {
  return members.filter((m) => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (!m.full_name.toLowerCase().includes(q) && !m.email.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (filters.role && m.role !== filters.role) return false;
    if (filters.status && m.status !== filters.status) return false;
    return true;
  });
}
