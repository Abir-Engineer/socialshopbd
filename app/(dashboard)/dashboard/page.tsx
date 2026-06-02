import { Suspense } from "react";
import { AnalyticsContent } from "@/components/analytics/analytics-content";
import { AnalyticsSkeleton } from "@/components/analytics/analytics-skeleton";

export const dynamic = "force-dynamic";

export default function DashboardHomePage() {
  return (
    <Suspense fallback={<AnalyticsSkeleton />}>
      <AnalyticsContent />
    </Suspense>
  );
}
