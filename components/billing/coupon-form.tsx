"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

type CouponFormProps = {
  plan: string;
  onCouponApplied: (code: string, discountAmount: number) => void;
  onCouponRemoved: () => void;
};

export function CouponForm({ plan, onCouponApplied, onCouponRemoved }: CouponFormProps) {
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleApply = () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/billing/validate-coupon", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: trimmed, plan }),
        });
        const json = await res.json();
        if (!res.ok || !json.valid) {
          setError(json.error ?? "Invalid coupon code.");
          return;
        }
        setApplied(true);
        onCouponApplied(trimmed, json.discountAmount);
      } catch {
        setError("Failed to validate coupon. Check your connection.");
      }
    });
  };

  const handleRemove = () => {
    setCode("");
    setApplied(false);
    setError(null);
    onCouponRemoved();
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground">Promo Code</label>
      {applied ? (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/50 px-3 py-2 dark:border-emerald-900/50 dark:bg-emerald-950/10">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{code}</span>
          <button
            type="button"
            onClick={handleRemove}
            className="ml-auto text-xs text-muted-foreground hover:text-foreground"
          >
            Remove
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter code"
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500"
            onKeyDown={(e) => e.key === "Enter" && handleApply()}
          />
          <button
            type="button"
            onClick={handleApply}
            disabled={isPending || !code.trim()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {isPending ? "..." : "Apply Coupon"}
          </button>
        </div>
      )}
      {error && (
        <p className="flex items-center gap-1 text-xs text-rose-600">
          <XCircle className="h-3 w-3" /> {error}
        </p>
      )}
    </div>
  );
}
