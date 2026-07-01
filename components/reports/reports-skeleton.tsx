export function ReportsSkeleton() {
  return (
    <section className="space-y-6" aria-busy="true" aria-label="Loading reports">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-64 animate-pulse rounded-md bg-muted" />
        </div>
        <div className="h-10 w-80 animate-pulse rounded-xl bg-muted" />
      </header>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <article key={i} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="h-4 w-20 animate-pulse rounded bg-muted" />
            <div className="mt-2 h-7 w-24 animate-pulse rounded bg-muted" />
            <div className="mt-1 h-3 w-16 animate-pulse rounded bg-muted" />
          </article>
        ))}
      </div>
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="h-72 w-full animate-pulse rounded-xl bg-muted" />
      </div>
    </section>
  );
}
