"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";
import { AlertTriangle } from "lucide-react";

export function DangerSection() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const toast = useToast();
  const router = useRouter();

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch("/api/delete-account", { method: "POST" });
      const result = await response.json();
      if (!response.ok) {
        toast.error(result.error || "Unable to delete your account. Please try again.");
        return;
      }
      toast.success("Account has been deleted successfully.");
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
      router.replace("/login");
      router.refresh();
    } catch {
      toast.error("Failed to delete account. Please try again.");
    } finally {
      setDeleting(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className="rounded-xl border border-rose-200 dark:border-rose-900/50 bg-card p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950/50">
          <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-foreground">Danger Zone</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Permanently delete your account and all associated data. This action is irreversible.
          </p>
          <p className="text-xs text-rose-600 dark:text-rose-400 mt-2">
            This will remove all your store data, products, orders, customers, and team members.
          </p>
          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            className="mt-4 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 transition cursor-pointer"
          >
            Delete account
          </button>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-foreground">Confirm account deletion</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Are you absolutely sure? This will permanently delete your account and all associated data.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-60 transition cursor-pointer"
              >
                {deleting ? "Deleting..." : "Yes, delete my account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
