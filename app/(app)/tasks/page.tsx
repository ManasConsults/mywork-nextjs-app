import { Suspense } from 'react';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';

import { authOptions } from '@/lib/auth/auth';
import { getTasksByUser } from '@/lib/services/task.service';
import { taskFiltersSchema } from '@/lib/schemas/task.schema';
import { TaskFilters } from './_components/TaskFilters';
import { TaskList } from './_components/TaskList';

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
  });

  const tasks = await getTasksByUser(userId, filters);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
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
        <TaskFilters currentStatus={filters.status} currentPriority={filters.priority} />
      </Suspense>
      <TaskList tasks={tasks} />
    </div>
  );
}
