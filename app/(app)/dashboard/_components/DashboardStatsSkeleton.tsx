export function DashboardStatsSkeleton(): React.JSX.Element {
  return (
    <>
      <section className="mt-10">
        <div className="mb-3 h-3 w-12 animate-pulse rounded bg-muted" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="h-3 w-16 animate-pulse rounded bg-muted" />
              <div className="mt-2 h-8 w-10 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-3 h-3 w-28 animate-pulse rounded bg-muted" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="h-3 w-20 animate-pulse rounded bg-muted" />
              <div className="mt-2 h-8 w-10 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-3 h-3 w-14 animate-pulse rounded bg-muted" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="h-3 w-16 animate-pulse rounded bg-muted" />
              <div className="mt-2 h-8 w-10 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
