'use client';

import { useRouter, useSearchParams } from 'next/navigation';

import { TASK_STATUSES, TASK_PRIORITIES } from '@/lib/schemas/task.schema';

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

interface TaskFiltersProps {
  currentStatus?: string;
  currentPriority?: string;
}

export function TaskFilters({ currentStatus, currentPriority }: TaskFiltersProps): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/tasks?${params.toString()}`);
  }

  return (
    <div className="mb-4 flex flex-wrap gap-3">
      <select
        value={currentStatus ?? ''}
        onChange={(e) => updateFilter('status', e.target.value)}
        className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
      >
        <option value="">All statuses</option>
        {TASK_STATUSES.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>

      <select
        value={currentPriority ?? ''}
        onChange={(e) => updateFilter('priority', e.target.value)}
        className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
      >
        <option value="">All priorities</option>
        {TASK_PRIORITIES.map((p) => (
          <option key={p} value={p}>
            {PRIORITY_LABELS[p]}
          </option>
        ))}
      </select>
    </div>
  );
}
