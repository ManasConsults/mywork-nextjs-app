import { Skeleton } from '@/components/ui/skeleton';

export function FeedbackListSkeleton(): React.JSX.Element {
  return (
    <>
      <Skeleton className="h-4 w-24 rounded bg-muted" />

      <div className="rounded-xl border border-border bg-card divide-y divide-border/60">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-start gap-3 px-4 py-3">
            <Skeleton className="h-5 w-20 rounded-full bg-muted" />
            <div className="flex-1 flex flex-col gap-2">
              <Skeleton className="h-3.5 w-3/4 rounded bg-muted" />
              <Skeleton className="h-3 w-1/3 rounded bg-muted" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full bg-muted" />
          </div>
        ))}
      </div>
    </>
  );
}
