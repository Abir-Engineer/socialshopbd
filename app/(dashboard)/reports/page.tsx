import { Suspense } from "react";
import { ReportsContent } from "@/components/reports/reports-content";
import { ReportsSkeleton } from "@/components/reports/reports-skeleton";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>;
};

export default async function ReportsPage({ searchParams }: Props) {
  const { period, from, to } = await searchParams;
  return (
    <Suspense fallback={<ReportsSkeleton />}>
      <ReportsContent period={period ?? "monthly"} from={from ?? ""} to={to ?? ""} />
    </Suspense>
  );
}
