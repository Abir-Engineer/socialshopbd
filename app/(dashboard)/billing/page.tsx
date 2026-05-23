import { Suspense } from "react";
import { getWorkspaceContext } from "@/lib/auth/organization";
import { getOrgUsage } from "@/lib/subscription/usage";
import { BillingView } from "@/components/billing/billing-view";

export const metadata = {
  title: "Billing & Subscription — Social Shop BD",
  description: "Manage your subscription plan, view usage, and upgrade your account.",
};

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  const context = await getWorkspaceContext();

  if (!context) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground text-sm">
        Could not load workspace. Please refresh.
      </div>
    );
  }

  const usage = await getOrgUsage(context.organizationId);

  return (
    <Suspense fallback={<BillingPageSkeleton />}>
      <BillingView
        context={context}
        usage={usage}
        alertReason={reason}
      />
    </Suspense>
  );
}

function BillingPageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 rounded-lg bg-muted" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-32 rounded-xl bg-muted" />
        ))}
      </div>
      <div className="h-64 rounded-xl bg-muted" />
    </div>
  );
}
