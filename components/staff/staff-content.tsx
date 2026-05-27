import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/auth/organization";
import { StaffView } from "@/components/staff/staff-view";

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
        <div className="rounded-xl border border-rose-200 bg-card p-5 text-sm text-rose-700 shadow-sm dark:border-rose-900 dark:text-rose-300">
          <p className="font-medium">Workspace context could not be loaded.</p>
        </div>
      </section>
    );
  }

  const supabase = await getSupabaseServerClient();

  // 1. Fetch active team members using safety security definer RPC
  const { data: members, error: membersError } = await supabase.rpc("get_organization_members", {
    org_id: context.organizationId,
  });

  // 2. Fetch pending invitations for this organization
  const { data: invitations, error: invitesError } = await supabase
    .from("organization_invitations")
    .select("*")
    .eq("organization_id", context.organizationId)
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  const fetchError = membersError || invitesError;

  if (fetchError) {
    return (
      <section className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold text-foreground">Staff Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage your team members and their access roles.
          </p>
        </header>
        <div className="rounded-xl border border-rose-200 bg-card p-5 text-sm text-rose-700 shadow-sm dark:border-rose-900 dark:text-rose-300">
          <p className="font-medium">Could not load team members</p>
          <p className="mt-1 text-rose-600/90 dark:text-rose-400/90">
            {fetchError.message}
          </p>
          <p className="mt-3 text-muted-foreground text-xs">
            Make sure to run the <code className="rounded bg-muted px-1 py-0.5 text-xs text-rose-800 dark:text-rose-200">20260523000008_role_based_access.sql</code> migration in your Supabase SQL Editor.
          </p>
        </div>
      </section>
    );
  }

  return (
    <StaffView
      currentUserRole={context.role}
      initialStaff={members ?? []}
      initialInvitations={invitations ?? []}
    />
  );
}
