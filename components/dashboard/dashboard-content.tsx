import { buildAnalyticsSnapshot } from "@/lib/analytics/snapshot";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { PremiumDashboard } from "./premium-dashboard";
import { AnalyticsSkeleton } from "@/components/analytics/analytics-skeleton";

export async function DashboardContent() {
  const supabase = await getSupabaseServerClient();
  const snapshot = await buildAnalyticsSnapshot(supabase);

  if (snapshot.loadError) {
    return <AnalyticsSkeleton />;
  }

  return <PremiumDashboard snapshot={snapshot} />;
}
