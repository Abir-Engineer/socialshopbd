import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/auth/organization";
import { StaffView } from "@/components/staff/staff-view";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

type MemberRecord = {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  email: string;
  full_name: string;
};

async function fetchMembersViaRpc(
  supabase: SupabaseClient<Database>,
  orgId: string,
): Promise<MemberRecord[] | null> {
  const { data, error } = await supabase.rpc("get_organization_members", {
    org_id: orgId,
  });
  if (error) return null;
  return (data ?? []) as MemberRecord[];
}

async function fetchMembersDirect(
  supabase: SupabaseClient<Database>,
  orgId: string,
): Promise<MemberRecord[]> {
  const { data, error } = await supabase
    .from("organization_members")
    .select("id, user_id, role, created_at")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data.map((m: { id: string; user_id: string; role: string; created_at: string }) => ({
    id: m.id,
    user_id: m.user_id,
    role: m.role,
    created_at: m.created_at,
    email: "",
    full_name: "Team Member",
  }));
}

export async function StaffContent() {
  const context = await getWorkspaceContext();
  if (!context) {
    return (
      <section className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold text-foreground">Staff Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage your team members and their access roles.
          </p>
        </header>
        <div className="rounded-xl border border-amber-200 bg-card p-5 text-sm text-amber-700 shadow-sm dark:border-amber-900 dark:text-amber-300">
          <p className="font-medium">Workspace context could not be loaded.</p>
          <p className="mt-2 text-amber-600/90 dark:text-amber-400/90 text-xs">
            Please ensure you have an active organization and run all migrations in your Supabase SQL Editor.
          </p>
        </div>
      </section>
    );
  }

  const supabase = await getSupabaseServerClient();

  // Try RPC first, fall back to direct table query if RPC function doesn't exist
  let members: MemberRecord[] = [];
  const rpcResult = await fetchMembersViaRpc(supabase, context.organizationId);
  if (rpcResult) {
    members = rpcResult;
  } else {
    members = await fetchMembersDirect(supabase, context.organizationId);
  }

  // Fetch pending invitations for this organization
  const { data: invitations, error: invitesError } = await supabase
    .from("organization_invitations")
    .select("*")
    .eq("organization_id", context.organizationId)
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (invitesError) {
    return (
      <section className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold text-foreground">Staff Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage your team members and their access roles.
          </p>
        </header>
        <div className="rounded-xl border border-rose-200 bg-card p-5 text-sm text-rose-700 shadow-sm dark:border-rose-900 dark:text-rose-300">
          <p className="font-medium">Could not load invitations</p>
          <p className="mt-1 text-rose-600/90 dark:text-rose-400/90">
            {invitesError.message}
          </p>
        </div>
      </section>
    );
  }

  return (
    <StaffView
      currentUserRole={context.role}
      initialStaff={members}
      initialInvitations={invitations ?? []}
    />
  );
}
