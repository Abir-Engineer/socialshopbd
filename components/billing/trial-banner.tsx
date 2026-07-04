"use client";

import { useState } from "react";
import Link from "next/link";
import { getTrialUrgency } from "@/lib/subscription/usage-client";

interface TrialBannerProps {
  daysLeft: number;
}

export function TrialBanner({ daysLeft }: TrialBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const urgency = getTrialUrgency(daysLeft);

  const styles = {
    ok:       "bg-violet-600",
    warning:  "bg-amber-500",
    critical: "bg-rose-600",
  };

  const message =
    daysLeft === 0
      ? "Your free trial ends today!"
      : `${daysLeft} ${daysLeft === 1 ? "day" : "days"} left on your free trial.`;

  return (
    <div className={`relative flex items-center justify-between gap-4 rounded-xl px-4 py-3 text-white shadow-md ${styles[urgency]}`}>
      <div className="flex items-center gap-3 min-w-0">
        <span className="shrink-0 text-base" aria-hidden>⏳</span>
        <p className="text-sm font-medium truncate">
          {message}{" "}
          <Link href="/billing" className="underline underline-offset-2 hover:opacity-80 transition font-semibold">
            Upgrade to Pro
          </Link>
        </p>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="shrink-0 rounded p-0.5 hover:bg-white/20 transition"
        aria-label="Dismiss trial banner"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden>
          <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
