"use client";

import { Shield } from "lucide-react";
import type { StaffMember } from "@/types/staff";
import {
  memberStatusBadgeClass,
  memberStatusLabel,
  ROLE_BADGE,
  ROLE_ICON_COLORS,
  getInitials,
  formatLastLogin,
} from "@/lib/staff/display";

interface StaffTableProps {
  members: StaffMember[];
  canManage: boolean;
  onEdit: (member: StaffMember) => void;
  onDelete: (member: StaffMember) => void;
  onView: (member: StaffMember) => void;
}

export function StaffTable({ members, canManage, onEdit, onDelete, onView }: StaffTableProps) {
  if (members.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="px-5 py-14 text-center">
          <div className="flex flex-col items-center gap-2">
            <Shield className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm font-medium text-foreground">No team members yet</p>
            <p className="text-xs text-muted-foreground">
              Invite team members to collaborate on your store.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-muted-foreground border-b border-border">
            <tr>
              <th className="px-4 py-3 font-medium sm:px-5">Member</th>
              <th className="px-4 py-3 font-medium sm:px-5">Email</th>
              <th className="px-4 py-3 font-medium sm:px-5">Role</th>
              <th className="px-4 py-3 font-medium sm:px-5">Status</th>
              <th className="px-4 py-3 font-medium sm:px-5 hidden md:table-cell">Last active</th>
              <th className="px-4 py-3 font-medium sm:px-5 hidden sm:table-cell">Joined</th>
              {canManage && <th className="px-4 py-3 font-medium sm:px-5 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr
                key={member.id}
                className="border-b border-border/70 last:border-b-0 hover:bg-muted/20 transition cursor-pointer"
                onClick={() => onView(member)}
              >
                <td className="px-4 py-3.5 sm:px-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-semibold text-white">
                      {getInitials(member.full_name)}
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
                <td className="px-4 py-3.5 sm:px-5">
                  <span className={memberStatusBadgeClass(member.status as never)}>
                    {memberStatusLabel(member.status as never)}
                  </span>
                </td>
                <td className="px-4 py-3.5 sm:px-5 text-muted-foreground text-xs hidden md:table-cell">
                  {formatLastLogin(member.last_login)}
                </td>
                <td className="px-4 py-3.5 sm:px-5 text-muted-foreground text-xs hidden sm:table-cell">
                  {new Date(member.created_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                {canManage && (
                  <td className="px-4 py-3.5 sm:px-5 text-right">
                    <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => onEdit(member)}
                        className="rounded-md px-2.5 py-1 text-xs font-medium text-foreground bg-muted hover:bg-muted-foreground/15 transition cursor-pointer"
                      >
                        Edit
                      </button>
                      {member.role !== "owner" && (
                        <button
                          type="button"
                          onClick={() => onDelete(member)}
                          className="rounded-md border border-rose-200 bg-background px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:border-rose-900/60 dark:text-rose-400 dark:hover:bg-rose-950/20 transition cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
