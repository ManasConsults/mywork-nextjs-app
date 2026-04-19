import Link from 'next/link';

import { cn } from '@/lib/utils';
import type { TaskListItem } from '@/lib/services/task.service';

const STATUS_BADGE: Record<string, string> = {
  BACKLOG: 'bg-muted text-foreground',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  BLOCKED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  DONE: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
};

const PRIORITY_BADGE: Record<string, string> = {
  LOW: 'bg-muted text-muted-foreground',
  MEDIUM: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  HIGH: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  CRITICAL: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

const STATUS_LABELS: Record<string, string> = {
  BACKLOG: 'To Do',
  IN_PROGRESS: 'In Progress',
  BLOCKED: 'On Hold',
  DONE: 'Done',
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
};

export function TaskList({ tasks }: { tasks: TaskListItem[] }): React.JSX.Element {
  if (tasks.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border py-12 text-center">
        <p className="text-sm text-muted-foreground">No tasks found.</p>
        <Link
          href="/tasks/new"
          className="mt-3 inline-block text-sm font-medium text-primary underline"
        >
          Create your first task
        </Link>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border/60 rounded-lg border border-border bg-card">
      {tasks.map((task) => (
        <li key={task.id}>
          <Link
            href={`/tasks/${task.id}`}
            className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-accent/40/50"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {task.title}
              </p>
              {task.dueDate && (
                <p className="text-xs text-muted-foreground">
                  Due {new Date(task.dueDate).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', PRIORITY_BADGE[task.priority])}>
                {PRIORITY_LABELS[task.priority]}
              </span>
              <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', STATUS_BADGE[task.status])}>
                {STATUS_LABELS[task.status]}
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
