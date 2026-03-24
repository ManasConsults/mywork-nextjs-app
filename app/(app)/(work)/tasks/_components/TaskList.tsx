import Link from 'next/link';

import type { TaskListItem } from '@/lib/services/task.service';

const STATUS_BADGE: Record<string, string> = {
  BACKLOG: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  BLOCKED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  DONE: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
};

const PRIORITY_BADGE: Record<string, string> = {
  LOW: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
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
      <div className="rounded-lg border border-dashed border-zinc-200 py-12 text-center dark:border-zinc-700">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No tasks found.</p>
        <Link
          href="/tasks/new"
          className="mt-3 inline-block text-sm font-medium text-teal-600 underline dark:text-zinc-50"
        >
          Create your first task
        </Link>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-zinc-100 rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
      {tasks.map((task) => (
        <li key={task.id}>
          <Link
            href={`/tasks/${task.id}`}
            className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                {task.title}
              </p>
              {task.dueDate && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Due {new Date(task.dueDate).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_BADGE[task.priority]}`}>
                {PRIORITY_LABELS[task.priority]}
              </span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[task.status]}`}>
                {STATUS_LABELS[task.status]}
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
