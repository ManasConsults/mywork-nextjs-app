'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import type { Task } from '@prisma/client';

interface WorkLogFiltersProps {
  tasks: Task[];
  currentTaskId?: string;
  currentDateFrom?: string;
  currentDateTo?: string;
}

export function WorkLogFilters({
  tasks,
  currentTaskId,
  currentDateFrom,
  currentDateTo,
}: WorkLogFiltersProps): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/work-logs?${params.toString()}`);
  }

  const selectCls =
    'rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300';

  return (
    <div className="mb-4 flex flex-wrap gap-3">
      <select
        value={currentTaskId ?? ''}
        onChange={(e) => updateFilter('taskId', e.target.value)}
        className={selectCls}
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
          onChange={(e) => updateFilter('dateFrom', e.target.value)}
          className={selectCls}
        />
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm text-zinc-500 dark:text-zinc-400">To</label>
        <input
          type="date"
          value={currentDateTo ?? ''}
          onChange={(e) => updateFilter('dateTo', e.target.value)}
          className={selectCls}
        />
      </div>
    </div>
  );
}
