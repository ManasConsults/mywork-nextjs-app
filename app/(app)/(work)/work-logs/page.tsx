import { Suspense } from 'react';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';

import { authOptions } from '@/lib/auth/auth';
import { getWorkLogsByUserPaged } from '@/lib/services/work-log.service';
import { getTasksByUser } from '@/lib/services/task.service';
import { workLogFiltersSchema } from '@/lib/schemas/work-log.schema';
import { WorkLogFilters } from './_components/WorkLogFilters';
import { WorkLogList } from './_components/WorkLogList';
import { WorkLogPagination } from './_components/WorkLogPagination';

export const metadata: Metadata = { title: 'MyWork — Work Logs' };

interface WorkLogsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
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

  const [{ logs, total, totalHours, page, pageSize, totalPages }, tasks] = await Promise.all([
    getWorkLogsByUserPaged(userId, filters),
    getTasksByUser(userId),
  ]);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Work Logs</h1>
          {totalHours > 0 && (
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Total logged:{' '}
              <span className="font-medium text-teal-600 dark:text-teal-400">
                {formatHours(totalHours)}
              </span>
              {' '}across {total} {total === 1 ? 'entry' : 'entries'}
            </p>
          )}
        </div>
        <Link
          href="/work-logs/new"
          className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
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

      <WorkLogList logs={logs} />

      <Suspense>
        <WorkLogPagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} />
      </Suspense>
    </div>
  );
}
