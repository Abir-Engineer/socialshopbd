"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useToast } from "@/components/ui/toast";
import {
  inviteStaffMember,
  updateStaffMember,
  deleteStaffMember,
  cancelInvitation,
} from "@/app/(dashboard)/staff/actions";
import type { OrgRole } from "@/types/organization";

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
  { value: "admin", label: "Admin" },
  { value: "staff", label: "Staff" },
  { value: "viewer", label: "Viewer" },
] as const;

const ROLE_BADGE: Record<string, string> = {
  owner:
    "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200",
  admin:
    "bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-200",
  staff:
    "bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-200",
  viewer:
    "bg-slate-100 text-slate-800 dark:bg-slate-800/80 dark:text-slate-200",
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
  const [isPending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [editMember, setEditMember] = useState<ActiveMember | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<ActiveMember | null>(null);
  const [cancelInviteConfirm, setCancelInviteConfirm] = useState<PendingInvitation | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const toast = useToast();

  const isOwnerOrAdmin = currentUserRole === "owner" || currentUserRole === "admin";

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

  // Helper check: Can current user manage a specific target role?
  const canManageMember = (target: ActiveMember) => {
    if (!isOwnerOrAdmin) return false;
    if (target.role === "owner") return false; // nobody can touch the owner
    if (currentUserRole === "admin" && target.role === "admin") return false; // admins cannot touch other admins
    return true;
  };

  return (
    <section className="space-y-8" aria-busy={isPending}>
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Team Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage your organization members, invite new team mates, and configure permissions.
          </p>
          {isPending && (
            <p className="mt-1 text-xs text-muted-foreground" aria-live="polite">
              Saving changes…
            </p>
          )}
        </div>
        {isOwnerOrAdmin && (
          <button
            type="button"
            onClick={() => {
              setFormError(null);
              setCreateOpen(true);
            }}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 cursor-pointer"
          >
            Invite Team Member
          </button>
        )}
      </header>

      {/* ACTIVE TEAM MEMBERS SECTION */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Active Members ({initialStaff.length})</h2>
        {initialStaff.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-14 text-center shadow-sm">
            <p className="text-sm text-muted-foreground">No active members found.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {initialStaff.map((member) => {
              const allowedToManage = canManageMember(member);
              return (
                <div
                  key={member.id}
                  className="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-sm transition hover:shadow-md"
                >
                  <div>
                    {/* Name + Avatar */}
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-semibold text-white">
                        {member.full_name
                          .split(" ")
                          .slice(0, 2)
                          .map((w) => w[0])
                          .join("")
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-card-foreground">
                          {member.full_name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {member.email}
                        </p>
                      </div>
                    </div>

                    {/* Role Badge */}
                    <div className="mt-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          ROLE_BADGE[member.role] ?? ROLE_BADGE.staff
                        }`}
                      >
                        {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                      </span>
                    </div>
                  </div>

                  {/* Dates & Actions */}
                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                    <p className="text-[10px] text-muted-foreground">
                      Joined{" "}
                      {new Date(member.created_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    {allowedToManage && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setFormError(null);
                            setEditMember(member);
                          }}
                          className="rounded bg-muted px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted-foreground/15 transition cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirm(member)}
                          className="rounded border border-rose-200 bg-background px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:border-rose-900/60 dark:text-rose-400 dark:hover:bg-rose-950/20 transition cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* PENDING INVITATIONS SECTION */}
      {isOwnerOrAdmin && (
        <div className="space-y-4 pt-4 border-t border-border">
          <h2 className="text-lg font-semibold text-foreground">Pending Invitations ({initialInvitations.length})</h2>
          {initialInvitations.length === 0 ? (
            <p className="text-sm text-muted-foreground bg-muted/40 border border-border/80 rounded-xl p-5 text-center">
              No pending invitations. Invite new members to see them here.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {initialInvitations.map((invite) => (
                <div
                  key={invite.id}
                  className="relative rounded-xl border border-dashed border-border bg-card/60 p-5 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground truncate">{invite.email}</p>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                          ROLE_BADGE[invite.role] ?? ROLE_BADGE.staff
                        }`}
                      >
                        {invite.role.charAt(0).toUpperCase() + invite.role.slice(1)}
                      </span>
                      <span className="inline-flex rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-500 dark:bg-amber-500/15">
                        Pending
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                    <p className="text-[10px] text-muted-foreground">
                      Sent{" "}
                      {new Date(invite.created_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                    <button
                      type="button"
                      onClick={() => setCancelInviteConfirm(invite)}
                      className="rounded border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
                    >
                      Cancel Invite
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
                <span className="text-sm font-medium text-card-foreground">Invitee Email Address</span>
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
                      {opt.label}
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
                <span className="text-sm font-medium text-card-foreground">Full name</span>
                <input
                  disabled
                  value={editMember.full_name}
                  className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground outline-none opacity-80"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-card-foreground">Email address</span>
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
                      {opt.label}
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

      {/* Remove Active Member Confirmation */}
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

      {/* Cancel Pending Invitation Confirmation */}
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
              Cancel the pending team invitation to <span className="font-semibold text-foreground">{cancelInviteConfirm.email}</span>?
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
