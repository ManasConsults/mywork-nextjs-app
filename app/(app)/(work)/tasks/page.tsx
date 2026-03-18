import { Suspense } from 'react';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';

import { authOptions } from '@/lib/auth/auth';
import { getTasksByUserPaged } from '@/lib/services/task.service';
import { taskFiltersSchema } from '@/lib/schemas/task.schema';
import { TaskFilters } from './_components/TaskFilters';
import { TaskList } from './_components/TaskList';
import { TaskPagination } from './_components/TaskPagination';

export const metadata: Metadata = { title: 'MyWork — Tasks' };

interface TasksPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
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

  const { tasks, total, page, pageSize, totalPages } = await getTasksByUserPaged(userId, filters);

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

      <Suspense>
        <TaskFilters
          currentStatus={filters.status}
          currentPriority={filters.priority}
          currentSortBy={filters.sortBy}
          currentSortOrder={filters.sortOrder}
          currentPageSize={filters.pageSize}
        />
      </Suspense>
      <TaskList tasks={tasks} />
      <Suspense>
        <TaskPagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} />
      </Suspense>
    </div>
  );
}
