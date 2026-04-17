export function FeedbackListSkeleton(): React.JSX.Element {
  return (
    <>
      <div className="h-4 w-24 animate-pulse rounded bg-zinc-100" />

      <div className="rounded-xl border border-border bg-card divide-y divide-border/60">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-start gap-3 px-4 py-3">
            <div className="h-5 w-20 animate-pulse rounded-full bg-zinc-100" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-3/4 animate-pulse rounded bg-zinc-100" />
              <div className="h-3 w-1/3 animate-pulse rounded bg-zinc-100" />
            </div>
            <div className="h-5 w-16 animate-pulse rounded-full bg-zinc-100" />
          </div>
        ))}
      </div>
    </>
  );
}
