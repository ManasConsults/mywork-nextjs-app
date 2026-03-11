import { Suspense } from 'react';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';

import { authOptions } from '@/lib/auth/auth';
import { getWorkLogsByUser } from '@/lib/services/work-log.service';
import { getTasksByUser } from '@/lib/services/task.service';
import { WorkLogFilters } from './_components/WorkLogFilters';
import { WorkLogList } from './_components/WorkLogList';

export const metadata: Metadata = { title: 'MyWork — Work Logs' };

interface WorkLogsPageProps {
  searchParams: Promise<{ taskId?: string; dateFrom?: string; dateTo?: string }>;
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

  const { taskId, dateFrom, dateTo } = await searchParams;

  const filters = {
    ...(taskId ? { taskId } : {}),
    ...(dateFrom ? { dateFrom: new Date(dateFrom) } : {}),
    ...(dateTo ? { dateTo: new Date(dateTo) } : {}),
  };

  const [logs, tasks] = await Promise.all([
    getWorkLogsByUser(userId, filters),
    getTasksByUser(userId),
  ]);

  const totalHours = logs.reduce((sum, l) => sum + (l.timeSpent ?? 0), 0);

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
              {' '}across {logs.length} {logs.length === 1 ? 'entry' : 'entries'}
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
          currentTaskId={taskId}
          currentDateFrom={dateFrom}
          currentDateTo={dateTo}
        />
      </Suspense>

      <WorkLogList logs={logs} />
    </div>
  );
}
