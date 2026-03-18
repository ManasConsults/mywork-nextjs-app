'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import type { Task } from '@prisma/client';

import { WORK_LOG_PAGE_SIZES } from '@/lib/schemas/work-log.schema';

interface WorkLogFiltersProps {
  tasks: Task[];
  currentTaskId?: string;
  currentDateFrom?: string;
  currentDateTo?: string;
  currentSortOrder: string;
  currentPageSize: number;
}

const SELECT_CLS =
  'rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300';

export function WorkLogFilters({
  tasks,
  currentTaskId,
  currentDateFrom,
  currentDateTo,
  currentSortOrder,
  currentPageSize,
}: WorkLogFiltersProps): React.JSX.Element {
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
    router.push(`/work-logs?${params.toString()}`);
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <select
        value={currentTaskId ?? ''}
        onChange={(e) => updateParam('taskId', e.target.value)}
        className={SELECT_CLS}
      >
        <option value="">All tasks</option>
        {tasks.map((t) => (
          <option key={t.id} value={t.id}>
            {t.title}
          </option>
        ))}
      </select>

      <div className="flex items-center gap-2">
        <label className="text-sm text-zinc-500 dark:text-zinc-400">From</label>
        <input
          type="date"
          value={currentDateFrom ?? ''}
          onChange={(e) => updateParam('dateFrom', e.target.value)}
          className={SELECT_CLS}
        />
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm text-zinc-500 dark:text-zinc-400">To</label>
        <input
          type="date"
          value={currentDateTo ?? ''}
          onChange={(e) => updateParam('dateTo', e.target.value)}
          className={SELECT_CLS}
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <select
          value={currentSortOrder}
          onChange={(e) => updateParam('sortOrder', e.target.value, false)}
          className={SELECT_CLS}
          aria-label="Sort order"
        >
          <option value="desc">Newest first</option>
          <option value="asc">Oldest first</option>
        </select>

        <select
          value={currentPageSize}
          onChange={(e) => updateParam('pageSize', e.target.value)}
          className={SELECT_CLS}
          aria-label="Items per page"
        >
          {WORK_LOG_PAGE_SIZES.map((n) => (
            <option key={n} value={n}>
              {n} per page
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
