import { Skeleton } from '@/components/ui/skeleton';

export default function NoteDetailLoading(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-3xl flex flex-col gap-4">
      <Skeleton className="h-8 w-64 rounded bg-muted" />
      <Skeleton className="h-10 w-full rounded bg-muted" />
      <div className="flex gap-3">
        <Skeleton className="h-8 w-40 rounded bg-muted" />
        <Skeleton className="h-8 w-48 rounded bg-muted" />
      </div>
      <Skeleton className="h-8 w-full rounded bg-muted" />
      <Skeleton className="h-72 w-full rounded bg-muted" />
    </div>
  );
}
