import { Suspense } from "react";
import { StaffContent } from "@/components/staff/staff-content";

export const dynamic = "force-dynamic";

function StaffSkeleton() {
  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="h-7 w-24 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-4 w-56 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-10 w-36 animate-pulse rounded-lg bg-muted" />
      </header>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-44 animate-pulse rounded-xl border border-border bg-card"
          />
        ))}
      </div>
    </section>
  );
}

export default function StaffPage() {
  return (
    <Suspense fallback={<StaffSkeleton />}>
      <StaffContent />
    </Suspense>
  );
}
