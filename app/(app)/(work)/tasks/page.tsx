import { Suspense } from 'react';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';

import { authOptions } from '@/lib/auth/auth';
import { taskFiltersSchema } from '@/lib/schemas/task.schema';
import { TaskFilters } from './_components/TaskFilters';
import { TaskListServer } from './_components/TaskListServer';

export const metadata: Metadata = { title: 'MyWork — Tasks' };

interface TasksPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function TaskListSkeleton(): React.JSX.Element {
  return (
    <div className="divide-y divide-zinc-100 rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex animate-pulse items-center gap-4 px-4 py-3">
          <div className="flex-1 space-y-1.5">
            <div className="h-4 w-2/3 rounded bg-zinc-100 dark:bg-zinc-800" />
            <div className="h-3 w-1/4 rounded bg-zinc-100 dark:bg-zinc-800" />
          </div>
          <div className="flex shrink-0 gap-2">
            <div className="h-5 w-14 rounded-full bg-zinc-100 dark:bg-zinc-800" />
            <div className="h-5 w-16 rounded-full bg-zinc-100 dark:bg-zinc-800" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function TasksPage({ searchParams }: TasksPageProps): Promise<React.JSX.Element> {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const params = await searchParams;
  const filters = taskFiltersSchema.parse({
    status: typeof params.status === 'string' ? params.status : undefined,
    priority: typeof params.priority === 'string' ? params.priority : undefined,
    sortBy: typeof params.sortBy === 'string' ? params.sortBy : undefined,
    sortOrder: typeof params.sortOrder === 'string' ? params.sortOrder : undefined,
    page: typeof params.page === 'string' ? params.page : undefined,
    pageSize: typeof params.pageSize === 'string' ? params.pageSize : undefined,
  });

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Tasks</h1>
        <div className="flex items-center gap-3">
          <Link
            href="/tasks/board"
            className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Board view
          </Link>
          <Link
            href="/tasks/new"
            className="rounded-md bg-teal-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-teal-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            New task
          </Link>
        </div>
      </div>

      {/* Filters render instantly — client component with no async work */}
      <Suspense>
        <TaskFilters
          currentStatus={filters.status}
          currentPriority={filters.priority}
          currentSortBy={filters.sortBy}
          currentSortOrder={filters.sortOrder}
          currentPageSize={filters.pageSize}
        />
      </Suspense>

      {/* List streams in — skeleton shown while DB query runs */}
      <Suspense fallback={<TaskListSkeleton />}>
        <TaskListServer userId={userId} filters={filters} />
      </Suspense>
    </div>
  );
}
