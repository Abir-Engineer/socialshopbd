import type { PlanDetails } from "@/lib/subscription/plans";
import { formatLimit } from "@/lib/subscription/plans";

const FEATURE_LIST: { key: keyof PlanDetails["features"]; label: string }[] = [
  { key: "courier_dispatch",    label: "Courier Dispatch (Steadfast, Pathao)" },
  { key: "advanced_analytics",  label: "Advanced Analytics" },
  { key: "ai_features",         label: "AI Features" },
  { key: "multi_staff",         label: "Multiple Staff Members" },
  { key: "export_data",         label: "Export Data (CSV/Excel)" },
  { key: "priority_support",    label: "Priority Support" },
];

interface PlanCardProps {
  plan: PlanDetails;
  isCurrent: boolean;
  isUpgrade: boolean;
  onUpgrade?: () => void;
}

export function PlanCard({ plan, isCurrent, isUpgrade }: PlanCardProps) {
  return (
    <div
      className={`relative flex flex-col rounded-xl border p-5 shadow-sm transition ${
        plan.is_popular
          ? "border-blue-400 bg-gradient-to-b from-blue-50/80 to-card dark:from-blue-950/20 dark:border-blue-700"
          : "border-border bg-card"
      }`}
    >
      {plan.is_popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-blue-600 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
            Most Popular
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-card-foreground">{plan.name}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{plan.tagline}</p>
        </div>
        {isCurrent && (
          <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
            Current
          </span>
        )}
      </div>

      {/* Price */}
      <div className="mt-4">
        {plan.price_bdt === null ? (
          <p className="text-2xl font-bold text-card-foreground">Free</p>
        ) : (
          <>
            <p className="text-2xl font-bold text-card-foreground">৳{plan.price_bdt.toLocaleString("en-BD")}</p>
            <p className="text-xs text-muted-foreground">per month</p>
          </>
        )}
      </div>

      {/* Limits */}
      <ul className="mt-4 space-y-1.5 text-sm">
        <li className="flex items-center gap-2 text-muted-foreground">
          <CheckIcon />
          {formatLimit(plan.limits.orders_per_month)} orders/month
        </li>
        <li className="flex items-center gap-2 text-muted-foreground">
          <CheckIcon />
          {formatLimit(plan.limits.products_total)} products
        </li>
        <li className="flex items-center gap-2 text-muted-foreground">
          <CheckIcon />
          {formatLimit(plan.limits.customers_total)} customers
        </li>
        <li className="flex items-center gap-2 text-muted-foreground">
          <CheckIcon />
          {formatLimit(plan.limits.staff_members)} staff member{plan.limits.staff_members !== 1 ? "s" : ""}
        </li>
      </ul>

      {/* Feature flags */}
      <ul className="mt-3 space-y-1.5 border-t border-border pt-3 text-sm">
        {FEATURE_LIST.map((f) => {
          const allowed = plan.features[f.key];
          return (
            <li key={f.key} className={`flex items-center gap-2 ${allowed ? "text-foreground" : "text-muted-foreground/50 line-through"}`}>
              {allowed ? <CheckIcon color="text-emerald-500" /> : <XIcon />}
              {f.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function CheckIcon({ color = "text-emerald-500" }: { color?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`h-3.5 w-3.5 shrink-0 ${color}`} aria-hidden>
      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" aria-hidden>
      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
