export default function DashboardLoading() {
  return (
    <section className="space-y-8" aria-busy="true" aria-label="Loading page content">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-4 w-24 animate-pulse rounded bg-blue-500/20" />
        <div className="h-9 w-64 animate-pulse rounded-lg bg-muted" />
        <div className="h-4 w-full max-w-lg animate-pulse rounded bg-muted/60" />
      </div>

      {/* Grid of Cards Skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-2xl border border-border bg-card p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-20 rounded bg-muted" />
              <div className="h-8 w-8 rounded-lg bg-muted" />
            </div>
            <div className="h-7 w-28 rounded bg-muted" />
          </div>
        ))}
      </div>

      {/* Large Content Block Skeleton */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="h-5 w-40 rounded bg-muted" />
            <div className="h-3.5 w-60 rounded bg-muted/60" />
          </div>
          <div className="h-8 w-20 rounded bg-muted" />
        </div>
        <div className="h-64 animate-pulse rounded-xl bg-muted/30" />
      </div>
    </section>
  );
}
