"use client";

import { useState, useTransition } from "react";
import { ROLE_OPTIONS, ROLE_BADGE } from "@/lib/staff/display";
import type { StaffMember } from "@/types/staff";

interface StaffFormProps {
  mode: "invite" | "edit";
  member?: StaffMember;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
  isPending: boolean;
  formError: string | null;
}

export function StaffForm({ mode, member, onClose, onSubmit, isPending, formError }: StaffFormProps) {
  const isBn = mode === "invite";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isPending) onClose();
      }}
    >
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-card-foreground">
          {isBn ? "টিম সদস্যকে আমন্ত্রণ জানান" : "Edit member role"}
        </h2>
        <form
          className="mt-4 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(new FormData(e.currentTarget));
          }}
        >
          {mode === "edit" && member && (
            <input type="hidden" name="id" value={member.id} />
          )}

          {mode === "invite" ? (
            <label className="block space-y-2">
              <span className="text-sm font-medium text-card-foreground">Email address</span>
              <input
                name="email"
                type="email"
                required
                disabled={isPending}
                placeholder="name@company.com"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-blue-500 disabled:opacity-60"
              />
            </label>
          ) : (
            <label className="block space-y-2">
              <span className="text-sm font-medium text-card-foreground">Member</span>
              <input
                disabled
                value={member?.full_name ?? ""}
                className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground outline-none opacity-80"
              />
            </label>
          )}

          <label className="block space-y-2">
            <span className="text-sm font-medium text-card-foreground">Access role</span>
            <select
              name="role"
              required
              defaultValue={member?.role ?? "staff"}
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

          <div className="rounded-lg bg-muted/50 p-3 space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role permissions</p>
            {ROLE_OPTIONS.map((opt) => (
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
              onClick={onClose}
              className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-60 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-70 cursor-pointer"
            >
              {isPending
                ? mode === "invite" ? "Sending invitation..." : "Saving..."
                : mode === "invite" ? "Send invitation" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
