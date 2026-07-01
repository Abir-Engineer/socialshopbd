import { getSupabaseServerClient } from "@/lib/supabase/server";
import { buildReport } from "@/lib/reports/service";
import { ReportsView } from "@/components/reports/reports-view";

type ReportsContentProps = {
  period: string;
  from: string;
  to: string;
};

export async function ReportsContent({ period: periodParam, from, to }: ReportsContentProps) {
  const supabase = await getSupabaseServerClient();
  const period = (["daily", "weekly", "monthly", "yearly"].includes(periodParam) ? periodParam : "monthly") as any;

  const customRange = from && to ? { from, to } : undefined;
  const data = await buildReport(supabase, period, customRange);

  return <ReportsView initialData={data} />;
}
