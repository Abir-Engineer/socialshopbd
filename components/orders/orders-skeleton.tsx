export function OrdersSkeleton() {
  return (
    <section className="space-y-6" aria-busy="true" aria-label="Loading orders">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <div className="h-8 w-56 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-80 max-w-full animate-pulse rounded-md bg-muted" />
        </div>
        <div className="h-10 w-32 animate-pulse rounded-lg bg-muted" />
      </header>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="space-y-4 border-b border-border px-4 py-4 sm:px-5">
          <div className="h-4 w-40 animate-pulse rounded bg-muted" />
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="h-10 w-full max-w-sm animate-pulse rounded-lg bg-muted" />
            <div className="h-10 w-full animate-pulse rounded-lg bg-muted sm:w-52" />
          </div>
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
