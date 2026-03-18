'use client';

import { useRouter, useSearchParams } from 'next/navigation';

import { TASK_STATUSES, TASK_PRIORITIES, TASK_SORT_BY, TASK_PAGE_SIZES } from '@/lib/schemas/task.schema';

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

const SORT_BY_LABELS: Record<string, string> = {
  createdAt: 'Created date',
  dueDate: 'Due date',
  status: 'Status',
};

interface TaskFiltersProps {
  currentStatus?: string;
  currentPriority?: string;
  currentSortBy: string;
  currentSortOrder: string;
  currentPageSize: number;
}

const SELECT_CLASS =
  'rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300';

export function TaskFilters({
  currentStatus,
  currentPriority,
  currentSortBy,
  currentSortOrder,
  currentPageSize,
}: TaskFiltersProps): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string, resetPage = true) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    if (resetPage) params.delete('page');
    router.push(`/tasks?${params.toString()}`);
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <select
        value={currentStatus ?? ''}
        onChange={(e) => updateParam('status', e.target.value)}
        className={SELECT_CLASS}
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
        onChange={(e) => updateParam('priority', e.target.value)}
        className={SELECT_CLASS}
      >
        <option value="">All priorities</option>
        {TASK_PRIORITIES.map((p) => (
          <option key={p} value={p}>
            {PRIORITY_LABELS[p]}
          </option>
        ))}
      </select>

      <div className="ml-auto flex items-center gap-2">
        <select
          value={currentSortBy}
          onChange={(e) => updateParam('sortBy', e.target.value, false)}
          className={SELECT_CLASS}
          aria-label="Sort by"
        >
          {TASK_SORT_BY.map((s) => (
            <option key={s} value={s}>
              {SORT_BY_LABELS[s]}
            </option>
          ))}
        </select>

        <select
          value={currentSortOrder}
          onChange={(e) => updateParam('sortOrder', e.target.value, false)}
          className={SELECT_CLASS}
          aria-label="Sort order"
        >
          <option value="desc">Newest first</option>
          <option value="asc">Oldest first</option>
        </select>

        <select
          value={currentPageSize}
          onChange={(e) => updateParam('pageSize', e.target.value)}
          className={SELECT_CLASS}
          aria-label="Items per page"
        >
          {TASK_PAGE_SIZES.map((n) => (
            <option key={n} value={n}>
              {n} per page
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
