import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/auth/organization";
import { fetchActivityLogs } from "@/lib/staff/service";
import { StaffDetailClient } from "./staff-detail-client";
import type { StaffMember, ActivityLogEntry } from "@/types/staff";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function StaffDetailInner({ memberId }: { memberId: string }) {
  const context = await getWorkspaceContext();
  if (!context) return notFound();

  const supabase = await getSupabaseServerClient();

  const { data: member } = await supabase
    .from("organization_members")
    .select("*")
    .eq("id", memberId)
    .eq("organization_id", context.organizationId)
    .single();

  if (!member) return notFound();

  // Get email + name from auth.users via the RPC
  const allMembers = await supabase.rpc("get_organization_members", {
    org_id: context.organizationId,
  });
  const enriched = (allMembers.data ?? []).find(
    (m: Record<string, unknown>) => m.id === memberId,
  ) as StaffMember | undefined;

  const staffMember: StaffMember = {
    id: member.id,
    user_id: member.user_id,
    role: member.role as StaffMember["role"],
    status: (member.status ?? "active") as StaffMember["status"],
    last_login: member.last_login as string | null,
    created_at: member.created_at,
    email: enriched?.email ?? "",
    full_name: enriched?.full_name ?? "Team Member",
  };

  const activityLogs = await fetchActivityLogs(
    supabase,
    context.organizationId,
    member.user_id,
    50,
  );

  return (
    <StaffDetailClient
      member={staffMember}
      activityLogs={activityLogs}
      currentUserRole={context.role}
    />
  );
}

function DetailSkeleton() {
  return (
    <section className="space-y-6">
      <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      <div className="h-32 animate-pulse rounded-xl bg-card border border-border" />
      <div className="h-64 animate-pulse rounded-xl bg-card border border-border" />
    </section>
  );
}

export default async function StaffDetailPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <StaffDetailInner memberId={id} />
    </Suspense>
  );
}
