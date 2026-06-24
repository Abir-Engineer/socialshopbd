"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { WorkspaceContext, OrgUsage } from "@/types/organization";
import { PLAN_DETAILS, formatLimit, formatPlanPrice, isAtLimit } from "@/lib/subscription/plans";
import { getDaysLeftInTrial, getSubscriptionBadge, isTrialExpired } from "@/lib/subscription/usage-client";
import { UsageMeter } from "./usage-meter";
import { PlanCard } from "./plan-card";
import { TrialBanner } from "./trial-banner";

interface BillingViewProps {
  context: WorkspaceContext;
  usage: OrgUsage;
  alertReason?: string;
}

const ALERT_MESSAGES: Record<string, { title: string; message: string }> = {
  trial_expired: {
    title: "আপনার ফ্রি ট্রায়াল শেষ হয়েছে",
    message: "সমস্ত বৈশিষ্ট্য ব্যবহার চালিয়ে যেতে প্রো-তে আপগ্রেড করুন, বা সীমিত অ্যাক্সেস সহ ফ্রি প্ল্যানে থাকুন।",
  },
  payment_required: {
    title: "পেমেন্ট প্রয়োজন",
    message: "আপনার শেষ পেমেন্ট ব্যর্থ হয়েছে। পূর্ণ অ্যাক্সেস পুনরুদ্ধার করতে আপনার বিলিং তথ্য আপডেট করুন।",
  },
};

export function BillingView({ context, usage, alertReason }: BillingViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedProvider, setSelectedProvider] = useState<"stripe" | "sslcommerz">("sslcommerz");
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const plan = context.plan;
  const status = context.subscriptionStatus;
  const trialEndsAt = context.trialEndsAt;
  const badge = getSubscriptionBadge(plan, status, trialEndsAt);
  const daysLeft = getDaysLeftInTrial(trialEndsAt);
  const trialExpired = isTrialExpired(trialEndsAt);
  const currentPlanDetails = PLAN_DETAILS[plan];
  const alert = alertReason ? ALERT_MESSAGES[alertReason] : null;

  const handleUpgrade = () => {
    setCheckoutError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/billing/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider: selectedProvider, plan: "pro" }),
        });
        const json = await res.json();
        if (!res.ok) {
          setCheckoutError(json.error ?? "চেকআউট ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
          return;
        }
        if (json.redirect_url) {
          window.location.href = json.redirect_url;
        }
      } catch {
        setCheckoutError("নেটওয়ার্ক ত্রুটি। আপনার সংযোগ পরীক্ষা করুন এবং আবার চেষ্টা করুন।");
      }
    });
  };

  const handleManagePortal = () => {
    startTransition(async () => {
      try {
        const res = await fetch("/api/billing/portal", { method: "POST" });
        const json = await res.json();
        if (json.url) window.location.href = json.url;
      } catch {
        setCheckoutError("বিলিং পোর্টাল খোলা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।");
      }
    });
  };

  // Free plan limits for usage meters
  const freeLimits = PLAN_DETAILS.free.limits;

  return (
    <section className="space-y-8 pb-12">
      {/* Trial Banner (top of page) */}
      {plan === "free_trial" && !trialExpired && daysLeft <= 7 && (
        <TrialBanner daysLeft={daysLeft} />
      )}

      {/* Alert Banner for redirected users */}
      {alert && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-900/60 dark:bg-amber-950/20">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">{alert.title}</p>
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">{alert.message}</p>
        </div>
      )}

      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">বিলিং ও সাবস্ক্রিপশন</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            আপনার প্ল্যান, ব্যবহারের সীমা এবং পেমেন্ট তথ্য পরিচালনা করুন।
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${badge.color}`}>
            {badge.label}
          </span>
          {(plan === "pro" || plan === "enterprise") && status === "active" && (
            <button
              type="button"
              onClick={handleManagePortal}
              disabled={isPending}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition disabled:opacity-60 cursor-pointer"
            >
              বিলিং ম্যানেজ করুন
            </button>
          )}
        </div>
      </header>

      {/* Current Plan Summary */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">বর্তমান প্ল্যান</p>
            <p className="mt-1 text-xl font-semibold text-card-foreground">{currentPlanDetails?.name ?? plan}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{currentPlanDetails?.tagline}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">বিলিং</p>
            <p className="mt-1 text-xl font-semibold text-card-foreground">
              {formatPlanPrice(plan, "bdt")}
            </p>
            {plan === "pro" && context.currentPeriodEnd && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                নবায়ন হয় {new Date(context.currentPeriodEnd).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            )}
          </div>
        </div>

        {plan === "free_trial" && (
          <div className="mt-4 border-t border-border pt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">ট্রায়াল পিরিয়ড</span>
              <span className={`font-medium ${trialExpired ? "text-rose-600" : daysLeft <= 3 ? "text-amber-600" : "text-foreground"}`}>
                {trialExpired ? "মেয়াদ উত্তীর্ণ" : `${daysLeft} দিন বাকি`}
              </span>
            </div>
            {!trialExpired && (
              <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${daysLeft <= 3 ? "bg-rose-500" : daysLeft <= 7 ? "bg-amber-500" : "bg-emerald-500"}`}
                  style={{ width: `${Math.min(100, (daysLeft / 14) * 100)}%` }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Usage Meters */}
      {(plan === "free" || plan === "free_trial") && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-foreground">এই সময়ের ব্যবহার</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <UsageMeter
              label="অর্ডার (এই মাসে)"
              current={usage.ordersThisMonth}
              limit={plan === "free" ? freeLimits.orders_per_month : null}
              unit="অর্ডার"
            />
            <UsageMeter
              label="পণ্য"
              current={usage.productsTotal}
              limit={plan === "free" ? freeLimits.products_total : null}
              unit="পণ্য"
            />
            <UsageMeter
              label="গ্রাহক"
              current={usage.customersTotal}
              limit={plan === "free" ? freeLimits.customers_total : null}
              unit="গ্রাহক"
            />
            <UsageMeter
              label="টিম সদস্য"
              current={usage.staffTotal}
              limit={plan === "free" ? freeLimits.staff_members : null}
              unit="সদস্য"
            />
          </div>
        </div>
      )}

      {plan === "pro" && (
        <div className="grid gap-4 sm:grid-cols-4">
          {[
            { label: "মোট অর্ডার", value: usage.ordersTotal.toLocaleString() },
            { label: "মোট পণ্য", value: usage.productsTotal.toLocaleString() },
            { label: "মোট গ্রাহক", value: usage.customersTotal.toLocaleString() },
            { label: "টিম সদস্য", value: `${usage.staffTotal} / ${formatLimit(PLAN_DETAILS.pro.limits.staff_members)}` },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="mt-1 text-xl font-semibold text-card-foreground">{item.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Pricing Cards */}
      {plan !== "pro" && plan !== "enterprise" && (
        <div className="space-y-5">
          <h2 className="text-base font-semibold text-foreground">উপলব্ধ প্ল্যান</h2>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <PlanCard plan={PLAN_DETAILS.free} isCurrent={plan === "free"} isUpgrade={false} />
            <PlanCard plan={PLAN_DETAILS.pro} isCurrent={false} isUpgrade={true} onUpgrade={() => {}} />
            <div className="rounded-xl border border-dashed border-border bg-card/50 p-6 flex flex-col items-center justify-center text-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5 text-muted-foreground" aria-hidden>
                  <path d="M17 20h5v-2a3 3 0 0 0-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 0 1 5.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 0 1 9.288 0" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">এন্টারপ্রাইজ</p>
                <p className="mt-1 text-xs text-muted-foreground">কাস্টম সীমা, SLA, ডেডিকেটেড সাপোর্ট এবং আরও অনেক কিছু।</p>
              </div>
              <a
                href="mailto:support@socialshopbd.com?subject=Enterprise%20Plan%20Inquiry"
                className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-muted transition"
              >
                সেলস-এ যোগাযোগ করুন
              </a>
            </div>
          </div>

          {/* Payment provider selector + checkout */}
          <div className="rounded-xl border border-blue-200 bg-blue-50/50 dark:border-blue-900/50 dark:bg-blue-950/10 p-5">
            <h3 className="text-sm font-semibold text-foreground">প্রো-তে আপগ্রেড করুন</h3>
            <p className="mt-1 text-sm text-muted-foreground">আপনার পছন্দের পেমেন্ট পদ্ধতি বেছে নিন:</p>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-2 max-w-sm">
              <button
                type="button"
                onClick={() => setSelectedProvider("sslcommerz")}
                className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition cursor-pointer ${
                  selectedProvider === "sslcommerz"
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                    : "border-border bg-background hover:bg-muted"
                }`}
              >
                <span className="text-lg">🇧🇩</span>
                <span className="text-xs font-medium text-foreground">এসএসএলকমার্জ</span>
                <span className="text-[10px] text-muted-foreground">বিকাশ, নগদ, কার্ড</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedProvider("stripe")}
                className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition cursor-pointer ${
                  selectedProvider === "stripe"
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                    : "border-border bg-background hover:bg-muted"
                }`}
              >
                <span className="text-lg">💳</span>
                <span className="text-xs font-medium text-foreground">Stripe</span>
                <span className="text-[10px] text-muted-foreground">আন্তর্জাতিক কার্ড</span>
              </button>
            </div>

            {checkoutError && (
              <p className="mt-3 rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                {checkoutError}
              </p>
            )}

            <button
              type="button"
              onClick={handleUpgrade}
              disabled={isPending}
              className="mt-4 flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {isPending ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  চেকআউট প্রস্তুত করা হচ্ছে…
                </>
              ) : (
                <>
                  প্রো-তে আপগ্রেড করুন — {selectedProvider === "sslcommerz" ? "৳999/mo" : "$9/mo"}
                </>
              )}
            </button>
            <p className="mt-2 text-xs text-muted-foreground">যেকোনো সময় বাতিল করুন। কোনো দীর্ঘমেয়াদী চুক্তি নেই।</p>
          </div>
        </div>
      )}

      {/* Pro plan — already subscribed */}
      {(plan === "pro" || plan === "enterprise") && status === "active" && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/10 p-5">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white text-xs font-bold">✓</span>
            <p className="font-medium text-foreground">আপনি {currentPlanDetails?.name} প্ল্যানে আছেন</p>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            সমস্ত বৈশিষ্ট্য আনলক করা আছে। পেমেন্ট পদ্ধতি আপডেট করতে বা বাতিল করতে উপরের &ldquo;বিলিং ম্যানেজ করুন&rdquo; ব্যবহার করুন।
          </p>
        </div>
      )}
    </section>
  );
}
