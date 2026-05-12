import { buildAnalyticsSnapshot } from "@/lib/analytics/snapshot";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";

export async function AnalyticsContent() {
  const supabase = await getSupabaseServerClient();
  const snapshot = await buildAnalyticsSnapshot(supabase);
  return <AnalyticsDashboard snapshot={snapshot} />;
}
