import { Suspense } from 'react';

import { getAchievementsByUserPaged } from '@/lib/services/achievement.service';
import { fiscalYearLabel } from '@/lib/utils/fiscal-year';
import type { AchievementFilters } from '@/lib/schemas/achievement.schema';
import { AchievementList } from './AchievementList';
import { AchievementPagination } from './AchievementPagination';
import { ExportButtons } from './ExportButtons';

interface Props {
  userId: string;
  filters: AchievementFilters;
  fiscalYearStartMonth: number;
}

export async function AchievementListServer({ userId, filters, fiscalYearStartMonth }: Props): Promise<React.JSX.Element> {
  const { achievements, total, page, pageSize, totalPages } =
    await getAchievementsByUserPaged(userId, filters, fiscalYearStartMonth);

  const fyLabel = filters.reviewYear
    ? fiscalYearLabel(filters.reviewYear, fiscalYearStartMonth)
    : 'All years';

  return (
    <>
      <p className="mb-4 text-sm text-muted-foreground">
        {total} {total === 1 ? 'achievement' : 'achievements'}
        {filters.reviewYear ? ` · ${fyLabel}` : ''}
      </p>
      <div className="mb-4 flex flex-wrap gap-2">
        <ExportButtons
          achievements={achievements}
          reviewYear={filters.reviewYear}
          fiscalYearStartMonth={fiscalYearStartMonth}
          category={filters.category}
        />
      </div>
      <AchievementList achievements={achievements} />
      <Suspense>
        <AchievementPagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} />
      </Suspense>
    </>
  );
}
