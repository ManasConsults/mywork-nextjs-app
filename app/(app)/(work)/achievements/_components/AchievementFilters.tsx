'use client';

import { useRouter, useSearchParams } from 'next/navigation';

import { ACHIEVEMENT_CATEGORIES } from '@/lib/schemas/achievement.schema';
import { fiscalYearLabel } from '@/lib/utils/fiscal-year';

interface AchievementFiltersProps {
  currentCategory?: string;
  currentReviewYear?: number;
  currentFiscalYear: number;
  fiscalYearStartMonth: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  Leadership: 'Leadership',
  Delivery: 'Delivery',
  Innovation: 'Innovation',
  Collaboration: 'Collaboration',
  Learning: 'Learning',
};

export function AchievementFilters({
  currentCategory,
  currentReviewYear,
  currentFiscalYear,
  fiscalYearStartMonth,
}: AchievementFiltersProps): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/achievements?${params.toString()}`);
  }

  const selectCls =
    'rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300';

  // Build year options: currentFY ± 4 years
  const yearOptions = Array.from({ length: 9 }, (_, i) => currentFiscalYear - 4 + i);

  return (
    <div className="mb-4 flex flex-wrap gap-3">
      <select
        value={currentCategory ?? ''}
        onChange={(e) => updateFilter('category', e.target.value)}
        className={selectCls}
      >
        <option value="">All categories</option>
        {ACHIEVEMENT_CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {CATEGORY_LABELS[c]}
          </option>
        ))}
      </select>

      <select
        value={currentReviewYear ?? ''}
        onChange={(e) => updateFilter('reviewYear', e.target.value)}
        className={selectCls}
      >
        <option value="">All years</option>
        {yearOptions.map((y) => (
          <option key={y} value={y}>
            {fiscalYearLabel(y, fiscalYearStartMonth)}
          </option>
        ))}
      </select>
    </div>
  );
}
