'use client';

import { useRouter, useSearchParams } from 'next/navigation';

import { TASK_STATUSES, TASK_PRIORITIES, TASK_SORT_BY, TASK_PAGE_SIZES } from '@/lib/schemas/task.schema';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

export function TaskFilters({
  currentStatus,
  currentPriority,
  currentSortBy,
  currentSortOrder,
  currentPageSize,
}: TaskFiltersProps): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string, resetPage = true): void {
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
      <Select value={currentStatus ?? ''} onValueChange={(v) => updateParam('status', v === '_all' ? '' : v)}>
        <SelectTrigger className="w-36">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_all">All statuses</SelectItem>
          {TASK_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={currentPriority ?? ''} onValueChange={(v) => updateParam('priority', v === '_all' ? '' : v)}>
        <SelectTrigger className="w-36">
          <SelectValue placeholder="All priorities" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_all">All priorities</SelectItem>
          {TASK_PRIORITIES.map((p) => (
            <SelectItem key={p} value={p}>
              {PRIORITY_LABELS[p]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="ml-auto flex items-center gap-2">
        <Select value={currentSortBy} onValueChange={(v) => updateParam('sortBy', v, false)}>
          <SelectTrigger className="w-36" aria-label="Sort by">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TASK_SORT_BY.map((s) => (
              <SelectItem key={s} value={s}>
                {SORT_BY_LABELS[s]}
              </SelectItem>
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
            {TASK_PAGE_SIZES.map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n} per page
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
