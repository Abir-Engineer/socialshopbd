export function CustomersSkeleton() {
  return (
    <section className="space-y-6" aria-busy="true" aria-label="Loading customers">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <div className="h-8 w-40 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-72 max-w-full animate-pulse rounded-md bg-muted" />
        </div>
        <div className="h-10 w-36 animate-pulse rounded-lg bg-muted" />
      </header>
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-4 py-4 sm:px-5">
          <div className="h-10 max-w-sm animate-pulse rounded-lg bg-muted" />
        </div>
        <div className="overflow-x-auto px-4 py-4 sm:px-5">
          <div className="min-w-[720px] space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-11 w-full animate-pulse rounded bg-muted" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
