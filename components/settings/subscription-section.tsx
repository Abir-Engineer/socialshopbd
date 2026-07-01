"use client";

import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";
import { Crown, CheckCircle, Circle } from "lucide-react";

interface Props {
  currentPlan: string;
  currentExpiry: string;
  userId: string;
}

const TIERS = [
  { name: "Starter", price: "Free", limit: "100 orders/month", desc: "For small businesses getting started.", popular: false, color: "slate" },
  { name: "Growth", price: "৳1,500/mo", limit: "1,000 orders/month", desc: "For scaling social shops.", popular: true, color: "indigo" },
  { name: "Enterprise", price: "৳4,500/mo", limit: "Unlimited orders", desc: "For full commerce automation.", popular: false, color: "blue" },
] as const;

export function SubscriptionSection({ currentPlan, currentExpiry, userId }: Props) {
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState(false);
  const toast = useToast();

  const handleUpgrade = async () => {
    if (!selected) return;
    setUpgrading(true);
    const supabase = getSupabaseBrowserClient();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    const { error } = await supabase.auth.updateUser({
      data: {
        ...(await supabase.auth.getUser()).data.user?.user_metadata,
        subscriptionPlan: selected,
        subscriptionExpiry: expiryDate.toISOString().split("T")[0],
      },
    });

    setUpgrading(false);
    if (error) {
      toast.error("Upgrade failed: " + error.message);
      return;
    }
    setShowUpgrade(false);
    toast.success(`Upgraded to ${selected} plan!`);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      {/* Current plan banner */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Crown className="h-4 w-4 text-amber-500" />
            Subscription & Billing
          </h2>
          <p className="text-sm text-muted-foreground">Manage your plan and billing information.</p>
        </div>
      </div>

      <div className="rounded-lg border border-blue-200 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <p className="text-xs uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400">Current plan</p>
          <h3 className="text-xl font-bold mt-1 text-foreground">{currentPlan}</h3>
          <p className="text-sm text-muted-foreground mt-1">Valid until <span className="font-semibold text-foreground">{currentExpiry}</span></p>
        </div>
        <div className="text-right">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <Circle className="h-2 w-2 fill-current" /> Active
          </span>
          {currentPlan === "Starter" && (
            <button
              type="button"
              onClick={() => setShowUpgrade(true)}
              className="block mt-2 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition cursor-pointer"
            >
              Upgrade plan
            </button>
          )}
        </div>
      </div>

      {/* Pricing tiers */}
      <div className="grid gap-4 sm:grid-cols-3">
        {TIERS.map((tier) => (
          <div
            key={tier.name}
            className={`relative rounded-xl border p-5 flex flex-col justify-between transition ${
              tier.name === currentPlan
                ? "border-blue-500 bg-blue-500/5 ring-1 ring-blue-500"
                : tier.popular
                  ? "border-indigo-500 bg-indigo-500/5"
                  : "border-border bg-background"
            }`}
          >
            {tier.popular && (
              <span className="absolute -top-2.5 left-4 rounded-full bg-indigo-600 px-2.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                Most popular
              </span>
            )}
            <div>
              <h4 className="text-base font-bold text-foreground">{tier.name}</h4>
              <p className="mt-2 text-xl font-black text-foreground">{tier.price}</p>
              <p className="mt-1 text-xs text-muted-foreground">{tier.limit}</p>
              <p className="mt-3 text-xs text-muted-foreground leading-relaxed">{tier.desc}</p>
            </div>
            {tier.name === currentPlan ? (
              <div className="mt-5 flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                <CheckCircle className="h-3.5 w-3.5" /> Current plan
              </div>
            ) : (
              <button
                type="button"
                disabled
                className="mt-5 w-full rounded-lg bg-muted py-2 text-xs font-semibold text-muted-foreground cursor-not-allowed"
              >
                {tier.name} — Contact sales
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Upgrade modal */}
      {showUpgrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-foreground">Upgrade plan</h3>
            <p className="text-sm text-muted-foreground mt-2">Select a plan to upgrade to.</p>
            <div className="mt-4 space-y-2">
              {TIERS.filter((t) => t.name !== currentPlan && t.name !== "Starter").map((tier) => (
                <button
                  key={tier.name}
                  type="button"
                  onClick={() => setSelected(tier.name)}
                  className={`w-full rounded-lg border p-3 text-left transition cursor-pointer ${
                    selected === tier.name
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                      : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <p className="text-sm font-semibold text-foreground">{tier.name}</p>
                  <p className="text-xs text-muted-foreground">{tier.price} — {tier.limit}</p>
                </button>
              ))}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setShowUpgrade(false); setSelected(null); }}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selected || upgrading}
                onClick={handleUpgrade}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition cursor-pointer"
              >
                {upgrading ? "Processing..." : `Upgrade to ${selected}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
