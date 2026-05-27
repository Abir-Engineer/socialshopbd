"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, useId } from "react";
import { useToast } from "@/components/ui/toast";
import {
  inviteStaffMember,
  updateStaffMember,
  deleteStaffMember,
  cancelInvitation,
} from "@/app/(dashboard)/staff/actions";
import type { OrgRole } from "@/types/organization";
import { isAdminOrAbove, isManagerOrAbove } from "@/lib/permissions";
import { Search, Shield, UserPlus, X } from "lucide-react";

type ActiveMember = {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  email: string;
  full_name: string;
};

type PendingInvitation = {
  id: string;
  email: string;
  role: string;
  created_at: string;
  status: string;
};

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin", desc: "Full access to all modules" },
  { value: "manager", label: "Manager", desc: "Orders, products, customers & analytics" },
  { value: "staff", label: "Staff", desc: "Dashboard only (limited)" },
  { value: "viewer", label: "Viewer", desc: "Read-only dashboard" },
] as const;

const ROLE_BADGE: Record<string, string> = {
  owner: "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200",
  admin: "bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-200",
  manager: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200",
  staff: "bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-200",
  viewer: "bg-slate-100 text-slate-800 dark:bg-slate-800/80 dark:text-slate-200",
};

const ROLE_ICON_COLORS: Record<string, string> = {
  owner: "text-rose-500",
  admin: "text-violet-500",
  manager: "text-amber-500",
  staff: "text-sky-500",
  viewer: "text-slate-500",
};

interface StaffViewProps {
  currentUserRole: OrgRole;
  initialStaff: ActiveMember[];
  initialInvitations: PendingInvitation[];
}

export function StaffView({
  currentUserRole,
  initialStaff,
  initialInvitations,
}: StaffViewProps) {
  const router = useRouter();
  const searchFieldId = useId();
  const [isPending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [editMember, setEditMember] = useState<ActiveMember | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<ActiveMember | null>(null);
  const [cancelInviteConfirm, setCancelInviteConfirm] = useState<PendingInvitation | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const toast = useToast();

  const userIsAdmin = isAdminOrAbove(currentUserRole);
  const userIsManager = isManagerOrAbove(currentUserRole);

  const filteredStaff = initialStaff.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.full_name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.role.toLowerCase().includes(q)
    );
  });

  const filteredInvitations = initialInvitations.filter((inv) => {
    if (!searchQuery.trim()) return true;
    return inv.email.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleInvite = (formData: FormData) => {
    setFormError(null);
    startTransition(async () => {
      const result = await inviteStaffMember(formData);
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      setCreateOpen(false);
      toast.success("Invitation sent successfully via email.");
      router.refresh();
    });
  };

  const handleUpdate = (formData: FormData) => {
    setFormError(null);
    startTransition(async () => {
      const result = await updateStaffMember(formData);
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      setEditMember(null);
      toast.success("Team member role updated.");
      router.refresh();
    });
  };

  const handleDelete = () => {
    if (!deleteConfirm) return;
    startTransition(async () => {
      const result = await deleteStaffMember(deleteConfirm.id);
      setDeleteConfirm(null);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Team member removed from workspace.");
      router.refresh();
    });
  };

  const handleCancelInvite = () => {
    if (!cancelInviteConfirm) return;
    startTransition(async () => {
      const result = await cancelInvitation(cancelInviteConfirm.id);
      setCancelInviteConfirm(null);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Invitation canceled successfully.");
      router.refresh();
    });
  };

  const canManageMember = (target: ActiveMember) => {
    if (!userIsAdmin) return false;
    if (target.role === "owner") return false;
    if (currentUserRole === "admin" && target.role === "admin") return false;
    return true;
  };

  return (
    <section className="space-y-6" aria-busy={isPending}>
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Staff Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage your team members, assign roles, and control permissions across the platform.
          </p>
          {isPending && (
            <p className="mt-1 text-xs text-muted-foreground" aria-live="polite">
              Saving changes…
            </p>
          )}
        </div>
        {userIsAdmin && (
          <button
            type="button"
            onClick={() => {
              setFormError(null);
              setCreateOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 cursor-pointer"
          >
            <UserPlus className="h-4 w-4" />
            Invite Team Member
          </button>
        )}
      </header>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          id={searchFieldId}
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, email, or role…"
          className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-10 text-sm text-foreground outline-none transition focus:border-blue-500"
          autoComplete="off"
        />
        {searchQuery.trim() !== "" && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Active Members Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-muted-foreground border-b border-border">
              <tr>
                <th className="px-4 py-3 font-medium sm:px-5">Member</th>
                <th className="px-4 py-3 font-medium sm:px-5">Email</th>
                <th className="px-4 py-3 font-medium sm:px-5">Role</th>
                <th className="px-4 py-3 font-medium sm:px-5 hidden sm:table-cell">Joined</th>
                <th className="px-4 py-3 font-medium sm:px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-14 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Shield className="h-8 w-8 text-muted-foreground/40" />
                      {searchQuery.trim() ? (
                        <>
                          <p className="text-sm font-medium text-foreground">No matching members</p>
                          <p className="text-xs text-muted-foreground">
                            Try a different search term.
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-medium text-foreground">No team members yet</p>
                          <p className="text-xs text-muted-foreground">
                            Invite team members to collaborate on your shop.
                          </p>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStaff.map((member) => {
                  const allowedToManage = canManageMember(member);
                  return (
                    <tr key={member.id} className="border-b border-border/70 last:border-b-0 hover:bg-muted/20 transition">
                      <td className="px-4 py-3.5 sm:px-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-semibold text-white">
                            {member.full_name
                              .split(" ")
                              .slice(0, 2)
                              .map((w) => w[0])
                              .join("")
                              .toUpperCase()}
                          </div>
                          <span className="font-medium text-foreground truncate max-w-[160px] sm:max-w-none">
                            {member.full_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 sm:px-5 text-muted-foreground truncate max-w-[180px] sm:max-w-none">
                        {member.email}
                      </td>
                      <td className="px-4 py-3.5 sm:px-5">
                        <div className="flex items-center gap-1.5">
                          <Shield className={`h-3.5 w-3.5 ${ROLE_ICON_COLORS[member.role] ?? "text-slate-500"}`} />
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              ROLE_BADGE[member.role] ?? ROLE_BADGE.viewer
                            }`}
                          >
                            {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 sm:px-5 text-muted-foreground text-xs hidden sm:table-cell">
                        {new Date(member.created_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3.5 sm:px-5 text-right">
                        {allowedToManage && (
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setFormError(null);
                                setEditMember(member);
                              }}
                              className="rounded-md px-2.5 py-1 text-xs font-medium text-foreground bg-muted hover:bg-muted-foreground/15 transition cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirm(member)}
                              className="rounded-md border border-rose-200 bg-background px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:border-rose-900/60 dark:text-rose-400 dark:hover:bg-rose-950/20 transition cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Invitations Table */}
      {userIsManager && filteredInvitations.length > 0 && (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">
              Pending Invitations ({filteredInvitations.length})
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
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            ROLE_BADGE[inv.role] ?? ROLE_BADGE.viewer
                          }`}
                        >
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

      {/* Invite Modal */}
      {createOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !isPending) setCreateOpen(false);
          }}
        >
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-card-foreground">Invite Team Member</h2>
            <form
              className="mt-4 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                handleInvite(new FormData(e.currentTarget));
              }}
            >
              <label className="block space-y-2">
                <span className="text-sm font-medium text-card-foreground">Email Address</span>
                <input
                  name="email"
                  type="email"
                  required
                  disabled={isPending}
                  placeholder="name@company.com"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-blue-500 disabled:opacity-60"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-card-foreground">Access Role</span>
                <select
                  name="role"
                  required
                  defaultValue="staff"
                  disabled={isPending}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-blue-500 disabled:opacity-60"
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label} — {opt.desc}
                    </option>
                  ))}
                </select>
              </label>

              {/* Role descriptions helper */}
              <div className="rounded-lg bg-muted/50 p-3 space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role Permissions</p>
                {ROLE_OPTIONS.filter((o) => o.value !== "viewer").map((opt) => (
                  <div key={opt.value} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <span
                      className={`mt-0.5 inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                        ROLE_BADGE[opt.value] ?? ROLE_BADGE.staff
                      }`}
                    >
                      {opt.label}
                    </span>
                    <span>{opt.desc}</span>
                  </div>
                ))}
              </div>

              {formError && (
                <p className="rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                  {formError}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setCreateOpen(false)}
                  className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-60 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-70 cursor-pointer"
                >
                  {isPending ? "Sending invite…" : "Send Invitation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {editMember && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !isPending) setEditMember(null);
          }}
        >
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-card-foreground">Edit Member Role</h2>
            <form
              className="mt-4 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdate(new FormData(e.currentTarget));
              }}
            >
              <input type="hidden" name="id" value={editMember.id} />

              <label className="block space-y-2">
                <span className="text-sm font-medium text-card-foreground">Full Name</span>
                <input
                  disabled
                  value={editMember.full_name}
                  className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground outline-none opacity-80"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-card-foreground">Email</span>
                <input
                  disabled
                  value={editMember.email}
                  className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground outline-none opacity-80"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-card-foreground">Access Role</span>
                <select
                  name="role"
                  required
                  defaultValue={editMember.role}
                  disabled={isPending}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-blue-500 disabled:opacity-60"
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label} — {opt.desc}
                    </option>
                  ))}
                </select>
              </label>

              {formError && (
                <p className="rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                  {formError}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setEditMember(null)}
                  className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-60 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-70 cursor-pointer"
                >
                  {isPending ? "Saving changes…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Remove Confirmation */}
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
              <span className="font-semibold text-foreground">{deleteConfirm.full_name}</span> from your team? They
              will immediately lose all access to this shop.
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
                {isPending ? "Removing…" : "Remove Member"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Invitation Confirmation */}
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
              Cancel the pending team invitation to{" "}
              <span className="font-semibold text-foreground">{cancelInviteConfirm.email}</span>?
              They will no longer be able to join using their invite link.
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
                {isPending ? "Canceling…" : "Cancel Invitation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
