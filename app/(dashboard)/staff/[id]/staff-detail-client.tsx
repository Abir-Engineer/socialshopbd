"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Shield, Clock, Activity, Mail, Calendar, Circle } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { updateMemberStatus } from "../actions";
import type { StaffMember, ActivityLogEntry } from "@/types/staff";
import type { OrgRole } from "@/types/organization";
import { isAdminOrAbove } from "@/lib/permissions";
import {
  memberStatusBadgeClass,
  memberStatusLabel,
  ROLE_BADGE,
  ROLE_ICON_COLORS,
  formatLastLogin,
  getInitials,
} from "@/lib/staff/display";

interface StaffDetailClientProps {
  member: StaffMember;
  activityLogs: ActivityLogEntry[];
  currentUserRole: OrgRole;
}

function ActivityList({ entries }: { entries: ActivityLogEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <Activity className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="divide-y divide-border/70 max-h-[400px] overflow-y-auto">
        {entries.map((entry) => (
          <div key={entry.id} className="px-5 py-3 hover:bg-muted/20 transition flex items-start gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-400 to-slate-500 text-[10px] font-semibold text-white mt-0.5">
              {entry.activity_type.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground">{entry.description}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {new Date(entry.created_at).toLocaleString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StaffDetailClient({
  member,
  activityLogs,
  currentUserRole,
}: StaffDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [currentStatus, setCurrentStatus] = useState(member.status);
  const toast = useToast();
  const userIsAdmin = isAdminOrAbove(currentUserRole);

  const handleStatusChange = (newStatus: "active" | "inactive" | "suspended") => {
    startTransition(async () => {
      const result = await updateMemberStatus(member.id, newStatus);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setCurrentStatus(newStatus);
      toast.success(`Member ${newStatus === "active" ? "activated" : newStatus === "suspended" ? "suspended" : "deactivated"} successfully.`);
      router.refresh();
    });
  };

  return (
    <section className="space-y-6">
      {/* Back link */}
      <Link
        href="/staff"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Staff
      </Link>

      {/* Hero card */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-8">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-2xl font-bold text-white">
              {getInitials(member.full_name)}
            </div>
            <div className="text-white">
              <h1 className="text-xl font-semibold">{member.full_name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    ROLE_BADGE[member.role] ?? ROLE_BADGE.viewer
                  }`}
                >
                  <Shield className="h-3 w-3" />
                  {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                </span>
                <span className={memberStatusBadgeClass(currentStatus as never)}>
                  <Circle className="h-2 w-2 mr-1 inline" />
                  {memberStatusLabel(currentStatus as never)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm font-medium text-foreground">{member.email || "—"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Joined</p>
              <p className="text-sm font-medium text-foreground">
                {new Date(member.created_at).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Last active</p>
              <p className="text-sm font-medium text-foreground">
                {formatLastLogin(member.last_login)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Recent activity</p>
              <p className="text-sm font-medium text-foreground">
                {activityLogs.length} {activityLogs.length === 1 ? "entry" : "entries"}
              </p>
            </div>
          </div>
        </div>

        {/* Status management */}
        {userIsAdmin && member.role !== "owner" && (
          <div className="border-t border-border px-6 py-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-foreground">Member status:</span>
              {(["active", "inactive", "suspended"] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  disabled={isPending || currentStatus === status}
                  onClick={() => handleStatusChange(status)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition cursor-pointer disabled:opacity-50 ${
                    currentStatus === status
                      ? "bg-foreground/10 text-foreground ring-1 ring-foreground/20"
                      : "bg-muted text-muted-foreground hover:bg-muted-foreground/15"
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                  {isPending && "..."}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {currentStatus === "suspended"
                ? "Suspended members cannot access the workspace until reactivated."
                : currentStatus === "inactive"
                  ? "Inactive members retain their role but are marked as not currently working."
                  : "Active members have full access based on their role."}
            </p>
          </div>
        )}
      </div>

      {/* Activity log */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          Activity history
        </h2>
        <ActivityList entries={activityLogs} />
      </div>
    </section>
  );
}
