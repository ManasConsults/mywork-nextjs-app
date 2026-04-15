'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import type { WorkLog } from '@prisma/client';

import { deleteWorkLogAction } from '@/lib/actions/work-log';
import { Button } from '@/components/ui/button';

type WorkLogWithTask = WorkLog & { task: { id: string; title: string } | null };

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
      <div className="rounded-lg border border-dashed border-border py-12 text-center">
        <p className="text-sm text-muted-foreground">No work logs found.</p>
        <Link href="/work-logs/new" className="mt-3 inline-block text-sm font-medium text-primary underline">
          Log your first work entry
        </Link>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border/60 rounded-lg border border-border bg-card">
      {logs.map((log) => (
        <li key={log.id} className="px-4 py-3">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  {new Date(log.date).toLocaleDateString()}
                </span>
                {log.task && (
                  <Link href={`/tasks/${log.task.id}`} className="truncate text-xs font-medium text-primary hover:underline">
                    {log.task.title}
                  </Link>
                )}
              </div>
              <p className="text-sm text-foreground">{log.description}</p>
              {log.outcome && (
                <p className="mt-1 text-xs text-muted-foreground">
                  <span className="font-medium">Outcome:</span> {log.outcome}
                </p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-3">
              {log.timeSpent != null && (
                <span className="rounded-full bg-primary/5 px-2 py-0.5 text-xs font-medium text-primary">
                  {formatHours(log.timeSpent)}
                </span>
              )}
              <Link href={`/work-logs/${log.id}/edit`} className="text-xs text-zinc-500 underline hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200">
                Edit
              </Link>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(log.id)} disabled={isPending} className="h-auto p-0 text-xs text-red-500 underline hover:text-red-700 hover:bg-transparent dark:text-red-400">
                Delete
              </Button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
