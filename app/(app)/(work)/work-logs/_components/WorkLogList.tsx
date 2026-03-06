'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import type { WorkLog } from '@prisma/client';

import { deleteWorkLogAction } from '@/lib/actions/work-log';

type WorkLogWithTask = WorkLog & { task: { id: string; title: string } };

function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function WorkLogList({ logs }: { logs: WorkLogWithTask[] }): React.JSX.Element {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: string) {
    if (!confirm('Delete this work log entry?')) return;
    startTransition(async () => {
      await deleteWorkLogAction(id);
      router.refresh();
    });
  }

  if (logs.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-200 py-12 text-center dark:border-zinc-700">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No work logs found.</p>
        <Link
          href="/work-logs/new"
          className="mt-3 inline-block text-sm font-medium text-teal-600 underline dark:text-teal-400"
        >
          Log your first work entry
        </Link>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-zinc-100 rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
      {logs.map((log) => (
        <li key={log.id} className="px-4 py-3">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  {new Date(log.date).toLocaleDateString()}
                </span>
                <Link
                  href={`/tasks/${log.task.id}`}
                  className="truncate text-xs font-medium text-teal-600 hover:underline dark:text-teal-400"
                >
                  {log.task.title}
                </Link>
              </div>
              <p className="text-sm text-zinc-800 dark:text-zinc-200">{log.description}</p>
              {log.outcome && (
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="font-medium">Outcome:</span> {log.outcome}
                </p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-3">
              {log.timeSpent != null && (
                <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700 dark:bg-teal-900/30 dark:text-teal-300">
                  {formatHours(log.timeSpent)}
                </span>
              )}
              <Link
                href={`/work-logs/${log.id}/edit`}
                className="text-xs text-zinc-500 underline hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                Edit
              </Link>
              <button
                onClick={() => handleDelete(log.id)}
                disabled={isPending}
                className="text-xs text-red-500 underline hover:text-red-700 disabled:opacity-50 dark:text-red-400"
              >
                Delete
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
