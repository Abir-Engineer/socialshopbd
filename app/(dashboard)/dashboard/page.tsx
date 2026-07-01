import { Suspense } from "react";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { AnalyticsSkeleton } from "@/components/analytics/analytics-skeleton";

export const dynamic = "force-dynamic";

export default function DashboardHomePage() {
  return (
    <Suspense fallback={<AnalyticsSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
