"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, useId, useMemo } from "react";
import { useToast } from "@/components/ui/toast";
import {
  inviteStaffMember,
  updateStaffMember,
  deleteStaffMember,
  cancelInvitation,
} from "@/app/(dashboard)/staff/actions";
import type { OrgRole } from "@/types/organization";
import type { StaffMember, StaffInvitation, AuditLogEntry } from "@/types/staff";
import { isAdminOrAbove, isManagerOrAbove } from "@/lib/permissions";
import { computeStaffStats, applyStaffFilters } from "@/lib/staff/service";
import { Search, UserPlus, X, Users, Shield, Activity } from "lucide-react";
import { StaffForm } from "./staff-form";
import { StaffTable } from "./staff-table";
import { StaffPermissions } from "./staff-permissions";
import { StaffActivity } from "./staff-activity";

type Tab = "members" | "permissions" | "activity";

const TABS: { key: Tab; label: string; icon: typeof Users }[] = [
  { key: "members",     label: "Members",     icon: Users },
  { key: "permissions", label: "Permissions", icon: Shield },
  { key: "activity",    label: "Activity",    icon: Activity },
];

interface StaffViewProps {
  currentUserRole: OrgRole;
  initialStaff: StaffMember[];
  initialInvitations: StaffInvitation[];
  initialAuditLogs: AuditLogEntry[];
}

export function StaffView({
  currentUserRole,
  initialStaff,
  initialInvitations,
  initialAuditLogs,
}: StaffViewProps) {
  const router = useRouter();
  const searchFieldId = useId();
  const [isPending, startTransition] = useTransition();
  const [tab, setTab] = useState<Tab>("members");
  const [createOpen, setCreateOpen] = useState(false);
  const [editMember, setEditMember] = useState<StaffMember | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<StaffMember | null>(null);
  const [cancelInviteConfirm, setCancelInviteConfirm] = useState<StaffInvitation | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const toast = useToast();

  const userIsAdmin = isAdminOrAbove(currentUserRole);
  const userIsManager = isManagerOrAbove(currentUserRole);

  const stats = useMemo(() => computeStaffStats(initialStaff), [initialStaff]);

  const filteredMembers = useMemo(
    () => applyStaffFilters(initialStaff, { search: searchQuery, role: roleFilter, status: statusFilter }),
    [initialStaff, searchQuery, roleFilter, statusFilter],
  );

  const filteredInvitations = initialInvitations.filter((inv) => {
    if (!searchQuery.trim()) return true;
    return inv.email.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const canManageMember = (target: StaffMember) => {
    if (!userIsAdmin) return false;
    if (target.role === "owner") return false;
    if (currentUserRole === "admin" && target.role === "admin") return false;
    return true;
  };

  const handleInvite = (formData: FormData) => {
    setFormError(null);
    startTransition(async () => {
      const result = await inviteStaffMember(formData);
      if (!result.ok) { setFormError(result.error); return; }
      setCreateOpen(false);
      toast.success("Invitation sent successfully.");
      router.refresh();
    });
  };

  const handleUpdate = (formData: FormData) => {
    setFormError(null);
    startTransition(async () => {
      const result = await updateStaffMember(formData);
      if (!result.ok) { setFormError(result.error); return; }
      setEditMember(null);
      toast.success("Member role updated.");
      router.refresh();
    });
  };

  const handleDelete = () => {
    if (!deleteConfirm) return;
    startTransition(async () => {
      const result = await deleteStaffMember(deleteConfirm.id);
      setDeleteConfirm(null);
      if (!result.ok) { toast.error(result.error); return; }
      toast.success("Member removed from workspace.");
      router.refresh();
    });
  };

  const handleCancelInvite = () => {
    if (!cancelInviteConfirm) return;
    startTransition(async () => {
      const result = await cancelInvitation(cancelInviteConfirm.id);
      setCancelInviteConfirm(null);
      if (!result.ok) { toast.error(result.error); return; }
      toast.success("Invitation cancelled.");
      router.refresh();
    });
  };

  return (
    <section className="space-y-6" aria-busy={isPending}>
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Staff Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage team members, assign roles, and control permissions across the platform.
          </p>
          {isPending && (
            <p className="mt-1 text-xs text-muted-foreground" aria-live="polite">
              Saving changes...
            </p>
          )}
        </div>
        {userIsAdmin && (
          <button
            type="button"
            onClick={() => { setFormError(null); setCreateOpen(true); }}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 cursor-pointer"
          >
            <UserPlus className="h-4 w-4" />
            Invite member
          </button>
        )}
      </header>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-muted/60 p-1 w-fit" role="tablist">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition cursor-pointer ${
                tab === t.key
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
              {t.key === "members" && (
                <span className="inline-flex items-center justify-center h-5 min-w-5 rounded-full bg-muted-foreground/15 px-1.5 text-[11px] font-semibold">
                  {initialStaff.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab panels */}
      {tab === "members" && (
        <>
          {/* Stat cards */}
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
            {[
              { label: "Total", value: stats.total, color: "text-foreground" },
              { label: "Active", value: stats.active, color: "text-emerald-600 dark:text-emerald-400" },
              { label: "Inactive", value: stats.inactive, color: "text-slate-500" },
              { label: "Suspended", value: stats.suspended, color: "text-rose-600 dark:text-rose-400" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{s.label}</p>
                <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Search + filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                id={searchFieldId}
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email or role..."
                className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-10 text-sm text-foreground outline-none transition focus:border-blue-500"
                autoComplete="off"
              />
              {searchQuery.trim() !== "" && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none focus:border-blue-500"
            >
              <option value="">All roles</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="staff">Staff</option>
              <option value="viewer">Viewer</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none focus:border-blue-500"
            >
              <option value="">All status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          {/* Members table */}
          <StaffTable
            members={filteredMembers}
            canManage={userIsAdmin}
            onEdit={setEditMember}
            onDelete={setDeleteConfirm}
            onView={(m) => router.push(`/staff/${m.id}`)}
          />

          {/* Pending invitations */}
          {userIsManager && filteredInvitations.length > 0 && (
            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-border">
                <h2 className="text-sm font-semibold text-foreground">
                  Pending invitations ({filteredInvitations.length})
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-muted-foreground border-b border-border">
                    <tr>
                      <th className="px-4 py-3 font-medium sm:px-5">Email</th>
                      <th className="px-4 py-3 font-medium sm:px-5">Role</th>
                      <th className="px-4 py-3 font-medium sm:px-5 hidden sm:table-cell">Sent</th>
                      <th className="px-4 py-3 font-medium sm:px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvitations.map((inv) => (
                      <tr key={inv.id} className="border-b border-border/70 last:border-b-0 hover:bg-muted/20 transition">
                        <td className="px-4 py-3.5 sm:px-5 text-foreground font-medium">{inv.email}</td>
                        <td className="px-4 py-3.5 sm:px-5">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-200">
                              {inv.role.charAt(0).toUpperCase() + inv.role.slice(1)}
                            </span>
                            <span className="inline-flex rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-500">
                              Pending
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 sm:px-5 text-muted-foreground text-xs hidden sm:table-cell">
                          {new Date(inv.created_at).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                          })}
                        </td>
                        <td className="px-4 py-3.5 sm:px-5 text-right">
                          {userIsAdmin && (
                            <button
                              type="button"
                              onClick={() => setCancelInviteConfirm(inv)}
                              className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {tab === "permissions" && <StaffPermissions />}
      {tab === "activity" && <StaffActivity auditLogs={initialAuditLogs} />}

      {/* Invite modal */}
      {createOpen && (
        <StaffForm
          mode="invite"
          onClose={() => setCreateOpen(false)}
          onSubmit={handleInvite}
          isPending={isPending}
          formError={formError}
        />
      )}

      {/* Edit modal */}
      {editMember && (
        <StaffForm
          mode="edit"
          member={editMember}
          onClose={() => setEditMember(null)}
          onSubmit={handleUpdate}
          isPending={isPending}
          formError={formError}
        />
      )}

      {/* Remove confirmation */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !isPending) setDeleteConfirm(null);
          }}
        >
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-card-foreground">Remove team member?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Are you sure you want to remove{" "}
              <span className="font-semibold text-foreground">{deleteConfirm.full_name}</span> from your team?
              They will immediately lose all access to this workspace.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                disabled={isPending}
                onClick={() => setDeleteConfirm(null)}
                className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-60 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleDelete}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-700 disabled:opacity-70 cursor-pointer"
              >
                {isPending ? "Removing..." : "Remove member"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel invitation confirmation */}
      {cancelInviteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !isPending) setCancelInviteConfirm(null);
          }}
        >
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-card-foreground">Cancel invitation?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Cancel pending invitation for{" "}
              <span className="font-semibold text-foreground">{cancelInviteConfirm.email}</span>?
              They will no longer be able to join using the invitation link.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                disabled={isPending}
                onClick={() => setCancelInviteConfirm(null)}
                className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-60 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleCancelInvite}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-700 disabled:opacity-70 cursor-pointer"
              >
                {isPending ? "Cancelling..." : "Cancel invitation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
