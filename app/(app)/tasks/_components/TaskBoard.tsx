'use client';

import type { Task } from '@prisma/client';

import { TASK_STATUSES } from '@/lib/schemas/task.schema';
import { TaskCard } from './TaskCard';

const COLUMN_CONFIG: Record<string, { label: string; headerClass: string }> = {
  BACKLOG: {
    label: 'To Do',
    headerClass: 'border-zinc-300 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-300',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    headerClass: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
  },
  BLOCKED: {
    label: 'On Hold',
    headerClass: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300',
  },
  DONE: {
    label: 'Done',
    headerClass: 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300',
  },
};

export function TaskBoard({ tasks }: { tasks: Task[] }): React.JSX.Element {
  const tasksByStatus = Object.fromEntries(
    TASK_STATUSES.map((s) => [s, tasks.filter((t) => t.status === s)]),
  );

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {TASK_STATUSES.map((status) => {
        const { label, headerClass } = COLUMN_CONFIG[status];
        const columnTasks = tasksByStatus[status];
        return (
          <div key={status} className="flex w-64 shrink-0 flex-col rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div className={`rounded-t-lg border-b px-3 py-2 ${headerClass}`}>
              <span className="text-sm font-medium">{label}</span>
              <span className="ml-2 text-xs opacity-70">({columnTasks.length})</span>
            </div>
            <div className="flex flex-col gap-2 p-2">
              {columnTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
              {columnTasks.length === 0 && (
                <p className="py-4 text-center text-xs text-zinc-400 dark:text-zinc-600">Empty</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
