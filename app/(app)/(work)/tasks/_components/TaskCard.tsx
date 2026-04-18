'use client';

import Link from 'next/link';
import { useTransition } from 'react';
import type { Task } from '@prisma/client';

import { TASK_STATUSES } from '@/lib/schemas/task.schema';
import { updateTaskAction } from '@/lib/actions/task';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const PRIORITY_BADGE_VARIANT: Record<string, string> = {
  LOW: 'bg-muted text-muted-foreground',
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
    <div className="rounded-md border border-border bg-card p-3">
      <div className="mb-2 flex items-start justify-between gap-2">
        <Link
          href={`/tasks/${task.id}`}
          className="text-sm font-medium text-foreground hover:underline"
        >
          {task.title}
        </Link>
        <Badge className={cn('shrink-0', PRIORITY_BADGE_VARIANT[task.priority])}>
          {PRIORITY_LABELS[task.priority]}
        </Badge>
      </div>

      {task.dueDate && (
        <p className="mb-2 text-xs text-muted-foreground">
          Due {new Date(task.dueDate).toLocaleDateString()}
        </p>
      )}

      <Select value={task.status} onValueChange={handleStatusChange} disabled={isPending}>
        <SelectTrigger className="h-7 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {TASK_STATUSES.map((s) => (
            <SelectItem key={s} value={s} className="text-xs">
              {STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
