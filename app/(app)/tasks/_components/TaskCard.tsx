'use client';

import Link from 'next/link';
import { useTransition } from 'react';
import type { Task } from '@prisma/client';

import { TASK_STATUSES } from '@/lib/schemas/task.schema';
import { updateTaskAction } from '@/lib/actions/task';

const PRIORITY_BADGE: Record<string, string> = {
  LOW: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400',
  MEDIUM: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  HIGH: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  CRITICAL: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
};

const STATUS_LABELS: Record<string, string> = {
  BACKLOG: 'To Do',
  IN_PROGRESS: 'In Progress',
  BLOCKED: 'On Hold',
  DONE: 'Done',
};

export function TaskCard({ task }: { task: Task }): React.JSX.Element {
  const [isPending, startTransition] = useTransition();

  function handleStatusChange(newStatus: string) {
    startTransition(async () => {
      await updateTaskAction(task.id, { status: newStatus as Task['status'] });
    });
  }

  return (
    <div className="rounded-md border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
      <div className="mb-2 flex items-start justify-between gap-2">
        <Link
          href={`/tasks/${task.id}`}
          className="text-sm font-medium text-zinc-900 hover:underline dark:text-zinc-50"
        >
          {task.title}
        </Link>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_BADGE[task.priority]}`}>
          {PRIORITY_LABELS[task.priority]}
        </span>
      </div>

      {task.dueDate && (
        <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
          Due {new Date(task.dueDate).toLocaleDateString()}
        </p>
      )}

      <select
        value={task.status}
        onChange={(e) => handleStatusChange(e.target.value)}
        disabled={isPending}
        className="w-full rounded border border-zinc-200 bg-transparent px-2 py-1 text-xs text-zinc-600 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-400"
      >
        {TASK_STATUSES.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>
    </div>
  );
}
