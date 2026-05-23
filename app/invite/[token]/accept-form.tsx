"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { acceptInvitation } from "@/app/invite/actions";

export function InviteAcceptForm({ token }: { token: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleAccept = () => {
    setError(null);
    startTransition(async () => {
      const res = await acceptInvitation(token);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      
      router.push("/");
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-lg bg-rose-950/50 border border-rose-900 px-3 py-2 text-sm text-rose-300">
          {error}
        </p>
      )}

      <button
        onClick={handleAccept}
        disabled={isPending}
        className="flex w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md hover:bg-blue-500 active:scale-95 transition disabled:opacity-75 disabled:cursor-not-allowed"
      >
        {isPending ? "Joining Team..." : "Accept Invitation & Go to Dashboard"}
      </button>
    </div>
  );
}
