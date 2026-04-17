'use client';

import { useRouter, useSearchParams } from 'next/navigation';

import { TODO_SORT_BY, TODO_STATUS_FILTER, TODO_PAGE_SIZES } from '@/lib/schemas/todo.schema';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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

export function TodoFiltersBar({
  currentStatus,
  currentSortBy,
  currentSortOrder,
  currentPageSize,
}: TodoFiltersBarProps): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string, resetPage = true): void {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    if (resetPage) params.delete('page');
    router.push(`/todo?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1 rounded-lg border border-border p-1">
        {TODO_STATUS_FILTER.map((s) => (
          <Button
            key={s}
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => updateParam('status', s)}
            className={cn(
              'rounded-md px-3 py-1 text-sm font-medium transition-colors',
              currentStatus === s
                ? 'bg-primary text-white hover:bg-primary hover:text-white dark:bg-accent/40 dark:text-zinc-900 dark:hover:bg-accent/40'
                : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200',
            )}
          >
            {STATUS_LABELS[s]}
          </Button>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Select value={currentSortBy} onValueChange={(v) => updateParam('sortBy', v, false)}>
          <SelectTrigger className="w-36" aria-label="Sort by">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TODO_SORT_BY.map((s) => (
              <SelectItem key={s} value={s}>{SORT_BY_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={currentSortOrder} onValueChange={(v) => updateParam('sortOrder', v, false)}>
          <SelectTrigger className="w-32" aria-label="Sort order">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">Newest first</SelectItem>
            <SelectItem value="asc">Oldest first</SelectItem>
          </SelectContent>
        </Select>

        <Select value={String(currentPageSize)} onValueChange={(v) => updateParam('pageSize', v)}>
          <SelectTrigger className="w-28" aria-label="Items per page">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TODO_PAGE_SIZES.map((n) => (
              <SelectItem key={n} value={String(n)}>{n} per page</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
