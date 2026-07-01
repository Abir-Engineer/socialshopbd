"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { WorkspaceContext, OrgUsage } from "@/types/organization";
import type { PaymentRecord, BillingInvoice, SubscriptionEvent } from "@/types/billing";
import { PLAN_DETAILS, formatLimit, formatPlanPrice } from "@/lib/subscription/plans";
import { getDaysLeftInTrial, isTrialExpired } from "@/lib/subscription/usage-client";
import { UsageMeter } from "./usage-meter";
import { PlanCard } from "./plan-card";
import { TrialBanner } from "./trial-banner";
import { PaymentHistory } from "./payment-history";
import { InvoiceList } from "./invoice-list";
import { CouponForm } from "./coupon-form";
import { formatBdt } from "@/lib/billing/display";
import { CheckCircle2, CreditCard, FileText, Clock, History, Sparkles, X, ChevronRight, TrendingUp } from "lucide-react";

type Tab = "plan" | "usage" | "history" | "payments" | "invoices";

interface BillingViewProps {
  context: WorkspaceContext;
  usage: OrgUsage;
  payments: PaymentRecord[];
  invoices: BillingInvoice[];
  subscriptionHistory: SubscriptionEvent[];
  alertReason?: string;
}

const ALERT_MESSAGES: Record<string, { title: string; message: string }> = {
  trial_expired: {
    title: "Your free trial has ended",
    message: "Upgrade to Pro to continue using all features, or stay on Free with limited access.",
  },
  payment_required: {
    title: "Payment required",
    message: "Your last payment failed. Update your billing info to restore full access.",
  },
};

const tabs: { key: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "plan", label: "Plan", icon: Sparkles },
  { key: "usage", label: "Usage", icon: TrendingUp },
  { key: "history", label: "History", icon: History },
  { key: "payments", label: "Payments", icon: CreditCard },
  { key: "invoices", label: "Invoices", icon: FileText },
];

function TabNav({ tabs, activeTab, setActiveTab }: { tabs: { key: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[]; activeTab: Tab; setActiveTab: (t: Tab) => void }) {
  return (
    <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-card p-1 shadow-sm">
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => setActiveTab(t.key)}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition cursor-pointer ${
            activeTab === t.key
              ? "bg-blue-600 text-white shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <t.icon className="h-3.5 w-3.5" />
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function BillingView({ context, usage, payments, invoices, subscriptionHistory, alertReason }: BillingViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<Tab>("plan");
  const [selectedProvider, setSelectedProvider] = useState<"stripe" | "sslcommerz">("sslcommerz");
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);

  const plan = context.plan;
  const status = context.subscriptionStatus;
  const trialEndsAt = context.trialEndsAt;
  const daysLeft = getDaysLeftInTrial(trialEndsAt);
  const trialExpired = isTrialExpired(trialEndsAt);
  const currentPlanDetails = PLAN_DETAILS[plan];
  const alert = alertReason ? ALERT_MESSAGES[alertReason] : null;
  const freeLimits = PLAN_DETAILS.free.limits;
  const isProOrEnterprise = plan === "pro" || plan === "enterprise";
  const basePrice = plan === "pro" ? 999 : plan === "enterprise" ? 4500 : 0;
  const finalPrice = Math.max(0, basePrice - couponDiscount);

  const handleUpgrade = () => {
    setCheckoutError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/billing/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider: selectedProvider, plan: "pro", couponCode }),
        });
        const json = await res.json();
        if (!res.ok) {
          setCheckoutError(json.error ?? "Checkout failed. Please try again.");
          return;
        }
        if (json.redirect_url) {
          window.location.href = json.redirect_url;
        }
      } catch {
        setCheckoutError("Network error. Check your connection and try again.");
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
        setCheckoutError("Could not open billing portal. Please try again.");
      }
    });
  };

  const handleCouponApplied = (code: string, discount: number) => {
    setCouponCode(code);
    setCouponDiscount(discount);
  };

  const handleCouponRemoved = () => {
    setCouponCode(null);
    setCouponDiscount(0);
  };

  const PlanTab = () => (
    <div className="space-y-6">
      {/* Current Plan Hero Card */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card to-muted/30 p-6 shadow-sm">
        <div className="absolute top-0 right-0 h-40 w-40 -mr-8 -mt-8 rounded-full bg-blue-500/5 dark:bg-blue-500/10" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Current Plan</p>
            <h2 className="mt-1 text-2xl font-bold text-foreground">{currentPlanDetails?.name ?? plan}</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">{currentPlanDetails?.tagline}</p>
            <div className="mt-3 flex items-center gap-3">
              <span className="text-2xl font-bold text-foreground">
                {formatPlanPrice(plan, "bdt")}
                {plan !== "free" && plan !== "free_trial" && <span className="text-sm font-normal text-muted-foreground">/mo</span>}
              </span>
              {plan === "pro" && context.currentPeriodEnd && (
                <span className="text-xs text-muted-foreground">
                  Renews {new Date(context.currentPeriodEnd).toLocaleDateString("en-BD", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isProOrEnterprise && status === "active" && (
              <button
                type="button"
                onClick={handleManagePortal}
                disabled={isPending}
                className="rounded-lg border border-border bg-background px-4 py-2 text-xs font-medium text-foreground hover:bg-muted transition disabled:opacity-60 cursor-pointer"
              >
                Manage Billing
              </button>
            )}
          </div>
        </div>

        {plan === "free_trial" && (
          <div className="mt-4 border-t border-border pt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Trial Period</span>
              <span className={`font-medium ${trialExpired ? "text-rose-600" : daysLeft <= 3 ? "text-amber-600" : "text-foreground"}`}>
                {trialExpired ? "Expired" : `${daysLeft} days left`}
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

        {/* Quick stats row */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Orders", value: usage.ordersTotal },
            { label: "Products", value: usage.productsTotal },
            { label: "Customers", value: usage.customersTotal },
            { label: "Staff", value: usage.staffTotal },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="mt-0.5 text-lg font-semibold text-foreground">{stat.value.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Plans Grid */}
      {!isProOrEnterprise && (
        <div className="space-y-5">
          <h2 className="text-base font-semibold text-foreground">Available Plans</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <PlanCard plan={PLAN_DETAILS.free} isCurrent={plan === "free"} isUpgrade={false} />
            <PlanCard plan={PLAN_DETAILS.pro} isCurrent={false} isUpgrade={true} onUpgrade={() => setActiveTab("plan")} />
            <div className="rounded-xl border border-dashed border-border bg-card/50 p-6 flex flex-col items-center justify-center text-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5 text-muted-foreground" aria-hidden>
                  <path d="M17 20h5v-2a3 3 0 0 0-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 0 1 5.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 0 1 9.288 0" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Enterprise</p>
                <p className="mt-1 text-xs text-muted-foreground">Custom limits, SLA, dedicated support & more.</p>
              </div>
              <a
                href="mailto:support@socialshopbd.com?subject=Enterprise%20Plan%20Inquiry"
                className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-muted transition"
              >
                Contact Sales
              </a>
            </div>
          </div>

          {/* Upgrade Section */}
          <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50/80 to-white p-6 dark:border-blue-900/50 dark:from-blue-950/10 dark:to-transparent">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              Upgrade to Pro
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">Unlock unlimited orders, products, customers, and premium features.</p>

            <div className="mt-4 grid gap-4 sm:grid-cols-4">
              {["Unlimited orders", "Unlimited products", "10 staff members", "Advanced analytics"].map((f) => (
                <div key={f} className="flex items-center gap-2 text-sm text-foreground">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  {f}
                </div>
              ))}
            </div>

            {/* Coupon */}
            <div className="mt-4 max-w-xs">
              <CouponForm plan={plan} onCouponApplied={handleCouponApplied} onCouponRemoved={handleCouponRemoved} />
            </div>

            {/* Provider selector */}
            <div className="mt-4 grid grid-cols-2 gap-3 max-w-sm">
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
                <span className="text-xs font-medium text-foreground">SSLCommerz</span>
                <span className="text-[10px] text-muted-foreground">bKash, Nagad, Card</span>
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
                <span className="text-[10px] text-muted-foreground">International cards</span>
              </button>
            </div>

            {/* Pricing summary with coupon */}
            {couponCode && (
              <div className="mt-3 space-y-1 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span>Base price:</span>
                  <span className="font-medium text-foreground">{formatBdt(basePrice)}</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-600">
                  <span>Discount ({couponCode}):</span>
                  <span className="font-medium">-{formatBdt(couponDiscount)}</span>
                </div>
                <div className="flex items-center gap-2 text-base font-bold text-foreground">
                  <span>Total:</span>
                  <span>{formatBdt(finalPrice)}</span>
                  {couponDiscount > 0 && <span className="text-xs text-emerald-600 font-normal">/mo</span>}
                </div>
              </div>
            )}

            {checkoutError && (
              <p className="mt-3 rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                {checkoutError}
              </p>
            )}

            <button
              type="button"
              onClick={handleUpgrade}
              disabled={isPending}
              className="mt-4 flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {isPending ? (
                <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Preparing checkout…</>
              ) : (
                <><Sparkles className="h-4 w-4" /> Upgrade to Pro — {formatBdt(finalPrice)}/mo</>
              )}
            </button>
            <p className="mt-2 text-xs text-muted-foreground">Cancel anytime. No long-term commitments.</p>
          </div>
        </div>
      )}

      {/* Already subscribed */}
      {isProOrEnterprise && status === "active" && (
        <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-white p-5 dark:border-emerald-900/50 dark:from-emerald-950/10 dark:to-transparent">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white text-sm font-bold">✓</span>
            <div>
              <p className="font-semibold text-foreground">You're on {currentPlanDetails?.name}</p>
              <p className="text-sm text-muted-foreground">All features unlocked. Use "Manage Billing" above to update payment method or cancel.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const UsageTab = () => (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-card-foreground mb-4">Resource Usage</h3>
        {(plan === "free" || plan === "free_trial") ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <UsageMeter label="Orders (this month)" current={usage.ordersThisMonth} limit={plan === "free" ? freeLimits.orders_per_month : null} unit="orders" />
            <UsageMeter label="Products" current={usage.productsTotal} limit={plan === "free" ? freeLimits.products_total : null} unit="products" />
            <UsageMeter label="Customers" current={usage.customersTotal} limit={plan === "free" ? freeLimits.customers_total : null} unit="customers" />
            <UsageMeter label="Team Members" current={usage.staffTotal} limit={plan === "free" ? freeLimits.staff_members : null} unit="members" />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <UsageMeter label="Orders" current={usage.ordersTotal} limit={null} unit="orders" />
            <UsageMeter label="Products" current={usage.productsTotal} limit={null} unit="products" />
            <UsageMeter label="Customers" current={usage.customersTotal} limit={null} unit="customers" />
            <UsageMeter label="Staff" current={usage.staffTotal} limit={plan === "pro" ? PLAN_DETAILS.pro.limits.staff_members : null} unit="members" />
          </div>
        )}
      </div>
    </div>
  );

  const HistoryTab = () => (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-card-foreground mb-4">Subscription History</h3>
      {subscriptionHistory.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Clock className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm font-medium text-foreground">No subscription history</p>
          <p className="mt-1 text-xs text-muted-foreground">History will appear after your first plan change or renewal.</p>
        </div>
      ) : (
        <div className="relative pl-6 space-y-0">
          {subscriptionHistory.map((event, i) => (
            <div key={event.id} className="relative pb-6 last:pb-0">
              {i < subscriptionHistory.length - 1 && (
                <div className="absolute left-[7px] top-3 bottom-0 w-0.5 bg-border" />
              )}
              <div className="absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-blue-500 bg-card" />
              <div className="ml-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-foreground capitalize">
                    {event.plan.replace("_", " ")}
                  </span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground capitalize">
                    {event.status}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    via {event.paymentProvider}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {event.periodStart ? new Date(event.periodStart).toLocaleDateString("en-BD") : "—"}
                  {" — "}
                  {event.periodEnd ? new Date(event.periodEnd).toLocaleDateString("en-BD") : "—"}
                  {event.amountBdt !== null && ` · ${formatBdt(event.amountBdt)}`}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {new Date(event.createdAt).toLocaleDateString("en-BD", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const PaymentsTab = () => (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-card-foreground mb-4">Payment History</h3>
      <PaymentHistory payments={payments} />
    </div>
  );

  const InvoicesTab = () => (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-card-foreground mb-4">Invoices</h3>
      <InvoiceList invoices={invoices} orgName={context.organizationName} />
    </div>
  );

  return (
    <section className={`space-y-6 pb-12 ${isPending ? "pointer-events-none opacity-60" : ""} animate-in fade-in duration-300`}>
      {/* Trial Banner */}
      {plan === "free_trial" && !trialExpired && daysLeft <= 7 && <TrialBanner daysLeft={daysLeft} />}

      {/* Alert Banner */}
      {alert && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-900/60 dark:bg-amber-950/20">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">{alert.title}</p>
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">{alert.message}</p>
        </div>
      )}

      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">Billing</p>
          <h1 className="mt-1 text-2xl font-semibold text-foreground">Billing & Subscription</h1>
          <p className="text-sm text-muted-foreground">Manage your plan, usage, and payment information.</p>
        </div>
      </header>

      <TabNav tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />

      {activeTab === "plan" && <PlanTab />}
      {activeTab === "usage" && <UsageTab />}
      {activeTab === "history" && <HistoryTab />}
      {activeTab === "payments" && <PaymentsTab />}
      {activeTab === "invoices" && <InvoicesTab />}
    </section>
  );
}
