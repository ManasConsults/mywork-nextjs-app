'use client';

import { useRouter, useSearchParams } from 'next/navigation';

import { TODO_SORT_BY, TODO_STATUS_FILTER, TODO_PAGE_SIZES } from '@/lib/schemas/todo.schema';

interface TodoFiltersBarProps {
  currentStatus: string;
  currentSortBy: string;
  currentSortOrder: string;
  currentPageSize: number;
}

const STATUS_LABELS: Record<string, string> = {
  incomplete: 'Incomplete',
  complete: 'Complete',
  all: 'All',
};

const SORT_BY_LABELS: Record<string, string> = {
  createdAt: 'Created date',
  dueDate: 'Due date',
  status: 'Status',
};

const SELECT_CLS =
  'rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300';

export function TodoFiltersBar({
  currentStatus,
  currentSortBy,
  currentSortOrder,
  currentPageSize,
}: TodoFiltersBarProps): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string, resetPage = true) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    if (resetPage) params.delete('page');
    router.push(`/todo?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Status filter */}
      <div className="flex items-center gap-1 rounded-lg border border-zinc-200 p-1 dark:border-zinc-700">
        {TODO_STATUS_FILTER.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => updateParam('status', s)}
            className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
              currentStatus === s
                ? 'bg-teal-600 text-white dark:bg-zinc-50 dark:text-zinc-900'
                : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Sort + page size pushed right */}
      <div className="ml-auto flex items-center gap-2">
        <select
          value={currentSortBy}
          onChange={(e) => updateParam('sortBy', e.target.value, false)}
          className={SELECT_CLS}
          aria-label="Sort by"
        >
          {TODO_SORT_BY.map((s) => (
            <option key={s} value={s}>
              {SORT_BY_LABELS[s]}
            </option>
          ))}
        </select>

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
          {TODO_PAGE_SIZES.map((n) => (
            <option key={n} value={n}>
              {n} per page
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
