'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import type { Task } from '@prisma/client';

import { WORK_LOG_PAGE_SIZES } from '@/lib/schemas/work-log.schema';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface WorkLogFiltersProps {
  tasks: Task[];
  currentTaskId?: string;
  currentDateFrom?: string;
  currentDateTo?: string;
  currentSortOrder: string;
  currentPageSize: number;
}

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

  function updateParam(key: string, value: string, resetPage = true): void {
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
      <Select value={currentTaskId ?? ''} onValueChange={(v) => updateParam('taskId', v === '_all' ? '' : v)}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="All tasks" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_all">All tasks</SelectItem>
          {tasks.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              {t.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">From</span>
        <Input
          type="date"
          value={currentDateFrom ?? ''}
          onChange={(e) => updateParam('dateFrom', e.target.value)}
          className="w-36"
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">To</span>
        <Input
          type="date"
          value={currentDateTo ?? ''}
          onChange={(e) => updateParam('dateTo', e.target.value)}
          className="w-36"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
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
            {WORK_LOG_PAGE_SIZES.map((n) => (
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
