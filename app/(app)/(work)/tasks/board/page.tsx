import Link from 'next/link';
import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';

import { authOptions } from '@/lib/auth/auth';
import { getTasksByUser } from '@/lib/services/task.service';
import { TaskBoard } from '../_components/TaskBoard';

export const metadata: Metadata = { title: 'MyWork — Task Board' };

export default async function TaskBoardPage(): Promise<React.JSX.Element> {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const tasks = await getTasksByUser(userId);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Task Board</h1>
        <div className="flex items-center gap-3">
          <Link
            href="/tasks"
            className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            List view
          </Link>
          <Link
            href="/tasks/new"
            className="rounded-md bg-teal-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-teal-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            New task
          </Link>
        </div>
      </div>
      <TaskBoard tasks={tasks} />
    </div>
  );
}
