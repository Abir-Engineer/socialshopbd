import type { SubscriptionStatus, OrgPlan } from "@/types/organization";

export function isTrialExpired(trialEndsAt: string): boolean {
  return new Date(trialEndsAt) < new Date();
}

export function getDaysLeftInTrial(trialEndsAt: string): number {
  const now = new Date();
  const end = new Date(trialEndsAt);
  const diffMs = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export function getTrialUrgency(daysLeft: number): "ok" | "warning" | "critical" {
  if (daysLeft > 7) return "ok";
  if (daysLeft > 2) return "warning";
  return "critical";
}

export function isSubscriptionActive(
  status: SubscriptionStatus,
  plan: OrgPlan,
  trialEndsAt: string
): boolean {
  if (status === "active") return true;
  if (status === "trialing" && plan === "free_trial" && !isTrialExpired(trialEndsAt)) return true;
  if (plan === "free") return true;
  return false;
}

export function needsUpgrade(
  plan: OrgPlan,
  status: SubscriptionStatus,
  trialEndsAt: string
): boolean {
  if (plan === "pro" || plan === "enterprise") return false;
  if (plan === "free") return false;
  if (plan === "free_trial" && isTrialExpired(trialEndsAt)) return true;
  return false;
}

export function getSubscriptionBadge(
  plan: OrgPlan,
  status: SubscriptionStatus,
  trialEndsAt: string
): { label: string; color: string } {
  if (plan === "free_trial") {
    const expired = isTrialExpired(trialEndsAt);
    const days = getDaysLeftInTrial(trialEndsAt);
    return {
      label: expired ? "Trial Expired" : `Trial — ${days}d left`,
      color: expired
        ? "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300"
        : days <= 3
        ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
        : "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300",
    };
  }
  if (plan === "free") {
    return { label: "Free", color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" };
  }
  if (plan === "pro") {
    if (status === "active") {
      return { label: "Pro", color: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300" };
    }
    if (status === "past_due") {
      return { label: "Pro — Past Due", color: "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300" };
    }
    if (status === "canceled") {
      return { label: "Pro (Canceled)", color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" };
    }
  }
  if (plan === "enterprise") {
    return { label: "Enterprise", color: "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300" };
  }
  return { label: plan, color: "bg-muted text-muted-foreground" };
}
