import { Suspense } from 'react';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';

import { authOptions } from '@/lib/auth/auth';
import { Skeleton } from '@/components/ui/skeleton';
import { getTasksByUser } from '@/lib/services/task.service';
import { workLogFiltersSchema } from '@/lib/schemas/work-log.schema';
import { WorkLogFilters } from './_components/WorkLogFilters';
import { WorkLogListServer } from './_components/WorkLogListServer';

export const metadata: Metadata = { title: 'MyWork — Work Logs' };

interface WorkLogsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function WorkLogListSkeleton(): React.JSX.Element {
  return (
    <div className="divide-y divide-border/60 rounded-lg border border-border bg-card">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-start gap-4 px-4 py-3">
          <div className="flex-1 flex flex-col gap-1.5">
            <div className="flex gap-2">
              <Skeleton className="h-3 w-20 rounded bg-muted" />
              <Skeleton className="h-3 w-32 rounded bg-muted" />
            </div>
            <Skeleton className="h-4 w-3/4 rounded bg-muted" />
            <Skeleton className="h-3 w-1/2 rounded bg-muted" />
          </div>
          <div className="flex shrink-0 gap-2">
            <Skeleton className="h-5 w-12 rounded-full bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function WorkLogsPage({ searchParams }: WorkLogsPageProps): Promise<React.JSX.Element> {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const params = await searchParams;
  const filters = workLogFiltersSchema.parse({
    taskId: typeof params.taskId === 'string' ? params.taskId : undefined,
    dateFrom: typeof params.dateFrom === 'string' ? params.dateFrom : undefined,
    dateTo: typeof params.dateTo === 'string' ? params.dateTo : undefined,
    sortOrder: typeof params.sortOrder === 'string' ? params.sortOrder : undefined,
    page: typeof params.page === 'string' ? params.page : undefined,
    pageSize: typeof params.pageSize === 'string' ? params.pageSize : undefined,
  });

  // Fast indexed lookup — needed for the task dropdown in filters
  const tasks = await getTasksByUser(userId);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/work-logs/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          + New work log
        </Link>
      </div>

      <Suspense>
        <WorkLogFilters
          tasks={tasks}
          currentTaskId={filters.taskId}
          currentDateFrom={typeof params.dateFrom === 'string' ? params.dateFrom : undefined}
          currentDateTo={typeof params.dateTo === 'string' ? params.dateTo : undefined}
          currentSortOrder={filters.sortOrder}
          currentPageSize={filters.pageSize}
        />
      </Suspense>

      <Suspense fallback={<WorkLogListSkeleton />}>
        <WorkLogListServer userId={userId} filters={filters} />
      </Suspense>
    </div>
  );
}
