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
  { value: "admin", label: "অ্যাডমিন", desc: "সমস্ত মডিউলে পূর্ণ অ্যাক্সেস" },
  { value: "manager", label: "ম্যানেজার", desc: "অর্ডার, পণ্য, গ্রাহক ও বিশ্লেষণ" },
  { value: "staff", label: "স্টাফ", desc: "শুধু ড্যাশবোর্ড (সীমিত)" },
  { value: "viewer", label: "দর্শক", desc: "শুধু-পঠনযোগ্য ড্যাশবোর্ড" },
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
      toast.success("ইমেলের মাধ্যমে আমন্ত্রণ সফলভাবে পাঠানো হয়েছে।");
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
      toast.success("টিম সদস্যের ভূমিকা আপডেট করা হয়েছে।");
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
      toast.success("ওয়ার্কস্পেস থেকে টিম সদস্য সরানো হয়েছে।");
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
      toast.success("আমন্ত্রণ সফলভাবে বাতিল করা হয়েছে।");
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
          <h1 className="text-2xl font-semibold text-foreground">স্টাফ ম্যানেজমেন্ট</h1>
          <p className="text-sm text-muted-foreground">
            আপনার টিম সদস্যদের পরিচালনা করুন, ভূমিকা নির্ধারণ করুন এবং প্ল্যাটফর্ম জুড়ে অনুমতি নিয়ন্ত্রণ করুন।
          </p>
          {isPending && (
            <p className="mt-1 text-xs text-muted-foreground" aria-live="polite">
              পরিবর্তন সংরক্ষণ করা হচ্ছে…
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
            টিম সদস্যকে আমন্ত্রণ জানান
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
          placeholder="নাম, ইমেল বা ভূমিকা দিয়ে খুঁজুন…"
          className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-10 text-sm text-foreground outline-none transition focus:border-blue-500"
          autoComplete="off"
        />
        {searchQuery.trim() !== "" && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
            aria-label="খোঁজা মুছুন"
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
                <th className="px-4 py-3 font-medium sm:px-5">সদস্য</th>
                <th className="px-4 py-3 font-medium sm:px-5">ইমেল</th>
                <th className="px-4 py-3 font-medium sm:px-5">ভূমিকা</th>
                <th className="px-4 py-3 font-medium sm:px-5 hidden sm:table-cell">যোগদানের তারিখ</th>
                <th className="px-4 py-3 font-medium sm:px-5 text-right">কার্যক্রম</th>
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
                          <p className="text-sm font-medium text-foreground">কোন মিলে যাওয়া সদস্য নেই</p>
                          <p className="text-xs text-muted-foreground">
                            অন্য একটি সার্চ টার্ম ব্যবহার করে দেখুন।
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-medium text-foreground">এখনো কোনো টিম সদস্য নেই</p>
                          <p className="text-xs text-muted-foreground">
                            আপনার দোকানে সহযোগিতার জন্য টিম সদস্যদের আমন্ত্রণ জানান।
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
                              সম্পাদনা
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirm(member)}
                              className="rounded-md border border-rose-200 bg-background px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:border-rose-900/60 dark:text-rose-400 dark:hover:bg-rose-950/20 transition cursor-pointer"
                            >
                              সরান
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
              অপেক্ষমাণ আমন্ত্রণ ({filteredInvitations.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-medium sm:px-5">ইমেল</th>
                  <th className="px-4 py-3 font-medium sm:px-5">ভূমিকা</th>
                  <th className="px-4 py-3 font-medium sm:px-5 hidden sm:table-cell">পাঠানো হয়েছে</th>
                  <th className="px-4 py-3 font-medium sm:px-5 text-right">কার্যক্রম</th>
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
                          অপেক্ষমাণ
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
                          বাতিল
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
            <h2 className="text-lg font-semibold text-card-foreground">টিম সদস্যকে আমন্ত্রণ জানান</h2>
            <form
              className="mt-4 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                handleInvite(new FormData(e.currentTarget));
              }}
            >
              <label className="block space-y-2">
                <span className="text-sm font-medium text-card-foreground">ইমেল ঠিকানা</span>
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
                <span className="text-sm font-medium text-card-foreground">অ্যাক্সেস ভূমিকা</span>
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
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">ভূমিকার অনুমতি</p>
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
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-70 cursor-pointer"
                  >
                    {isPending ? "আমন্ত্রণ পাঠানো হচ্ছে…" : "আমন্ত্রণ পাঠান"}
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
            <h2 className="text-lg font-semibold text-card-foreground">সদস্যের ভূমিকা সম্পাদনা করুন</h2>
            <form
              className="mt-4 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdate(new FormData(e.currentTarget));
              }}
            >
              <input type="hidden" name="id" value={editMember.id} />

              <label className="block space-y-2">
                <span className="text-sm font-medium text-card-foreground">পূর্ণ নাম</span>
                <input
                  disabled
                  value={editMember.full_name}
                  className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground outline-none opacity-80"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-card-foreground">ইমেল</span>
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
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-70 cursor-pointer"
                >
                  {isPending ? "পরিবর্তন সংরক্ষণ করা হচ্ছে…" : "পরিবর্তন সংরক্ষণ করুন"}
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
            <h2 className="text-lg font-semibold text-card-foreground">টিম সদস্য সরাবেন?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              আপনি কি নিশ্চিত আপনি{" "}
              <span className="font-semibold text-foreground">{deleteConfirm.full_name}</span> কে আপনার টিম থেকে সরাতে চান? তারা
              অবিলম্বে এই দোকানের সমস্ত অ্যাক্সেস হারাবে।
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                disabled={isPending}
                onClick={() => setDeleteConfirm(null)}
                className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-60 cursor-pointer"
              >
                  বাতিল
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleDelete}
                  className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-700 disabled:opacity-70 cursor-pointer"
                >
                  {isPending ? "সরানো হচ্ছে…" : "সদস্য সরান"}
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
            <h2 className="text-lg font-semibold text-card-foreground">আমন্ত্রণ বাতিল করবেন?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              অপেক্ষমাণ টিম আমন্ত্রণ বাতিল করবেন{" "}
              <span className="font-semibold text-foreground">{cancelInviteConfirm.email}</span>?
              তারা আর তাদের আমন্ত্রণ লিংক ব্যবহার করে যোগ দিতে পারবে না।
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                disabled={isPending}
                onClick={() => setCancelInviteConfirm(null)}
                className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-60 cursor-pointer"
              >
                  বাতিল
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleCancelInvite}
                  className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-700 disabled:opacity-70 cursor-pointer"
                >
                  {isPending ? "বাতিল করা হচ্ছে…" : "আমন্ত্রণ বাতিল করুন"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
