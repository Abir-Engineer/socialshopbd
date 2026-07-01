import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/auth/organization";
import { StaffView } from "@/components/staff/staff-view";
import { fetchStaffMembers, fetchAuditLogs } from "@/lib/staff/service";
import type { StaffMember, StaffInvitation, AuditLogEntry } from "@/types/staff";

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
          <p className="font-medium">Could not load workspace context.</p>
          <p className="mt-2 text-amber-600/90 dark:text-amber-400/90 text-xs">
            Please ensure you have an active organization and run all migrations in your Supabase SQL editor.
          </p>
        </div>
      </section>
    );
  }

  const supabase = await getSupabaseServerClient();

  const [members, invitationsResult, auditLogs] = await Promise.all([
    fetchStaffMembers(supabase, context.organizationId),
    supabase
      .from("organization_invitations")
      .select("*")
      .eq("organization_id", context.organizationId)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false }),
    fetchAuditLogs(supabase, context.organizationId, 100),
  ]);

  const invitations = (invitationsResult.data ?? []) as StaffInvitation[];

  if (invitationsResult.error) {
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
          <p className="mt-1 text-rose-600/90 dark:text-rose-400/90">{invitationsResult.error.message}</p>
        </div>
      </section>
    );
  }

  return (
    <StaffView
      currentUserRole={context.role}
      initialStaff={members}
      initialInvitations={invitations}
      initialAuditLogs={auditLogs}
    />
  );
}
