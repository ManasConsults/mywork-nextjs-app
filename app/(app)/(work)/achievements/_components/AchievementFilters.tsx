'use client';

import { useRouter, useSearchParams } from 'next/navigation';

import { ACHIEVEMENT_CATEGORIES, ACHIEVEMENT_SORT_BY, ACHIEVEMENT_PAGE_SIZES } from '@/lib/schemas/achievement.schema';
import { fiscalYearLabel } from '@/lib/utils/fiscal-year';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AchievementFiltersProps {
  currentCategory?: string;
  currentReviewYear?: number;
  currentFiscalYear: number;
  fiscalYearStartMonth: number;
  currentSortBy: string;
  currentSortOrder: string;
  currentPageSize: number;
}

const SORT_BY_LABELS: Record<string, string> = {
  createdAt: 'Created date',
  updatedAt: 'Updated date',
};

export function AchievementFilters({
  currentCategory,
  currentReviewYear,
  currentFiscalYear,
  fiscalYearStartMonth,
  currentSortBy,
  currentSortOrder,
  currentPageSize,
}: AchievementFiltersProps): React.JSX.Element {
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
    router.push(`/achievements?${params.toString()}`);
  }

  const yearOptions = Array.from({ length: 9 }, (_, i) => currentFiscalYear - 4 + i);

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <Select value={currentCategory ?? ''} onValueChange={(v) => updateParam('category', v === '_all' ? '' : v)}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="All categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_all">All categories</SelectItem>
          {ACHIEVEMENT_CATEGORIES.map((c) => (
            <SelectItem key={c} value={c}>{c}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={currentReviewYear != null ? String(currentReviewYear) : ''}
        onValueChange={(v) => updateParam('reviewYear', v === '_all' ? '' : v)}
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder="All years" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_all">All years</SelectItem>
          {yearOptions.map((y) => (
            <SelectItem key={y} value={String(y)}>
              {fiscalYearLabel(y, fiscalYearStartMonth)}
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
            {ACHIEVEMENT_SORT_BY.map((s) => (
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
            {ACHIEVEMENT_PAGE_SIZES.map((n) => (
              <SelectItem key={n} value={String(n)}>{n} per page</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
