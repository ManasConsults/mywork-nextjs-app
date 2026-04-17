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
        <div className="flex items-center gap-3">
          <Link
            href="/tasks"
            className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent/40 dark:text-muted-foreground"
          >
            List view
          </Link>
          <Link
            href="/tasks/new?from=board"
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary/90 dark:bg-accent/40 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            New task
          </Link>
        </div>
      </div>
      <TaskBoard tasks={tasks} />
    </div>
  );
}
