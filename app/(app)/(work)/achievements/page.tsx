import { Suspense } from 'react';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';

import { authOptions } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { getAchievementsByUserPaged } from '@/lib/services/achievement.service';
import { currentFiscalYear, fiscalYearLabel } from '@/lib/utils/fiscal-year';
import { achievementFiltersSchema } from '@/lib/schemas/achievement.schema';
import { AchievementFilters } from './_components/AchievementFilters';
import { AchievementList } from './_components/AchievementList';
import { AchievementPagination } from './_components/AchievementPagination';
import { FiscalYearSettings } from './_components/FiscalYearSettings';
import { ExportButtons } from './_components/ExportButtons';

export const metadata: Metadata = { title: 'MyWork — Achievements' };

interface AchievementsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AchievementsPage({ searchParams }: AchievementsPageProps): Promise<React.JSX.Element> {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const params = await searchParams;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { fiscalYearStartMonth: true },
  });
  const fiscalYearStartMonth = user?.fiscalYearStartMonth ?? 4;
  const fyNow = currentFiscalYear(fiscalYearStartMonth);

  const filters = achievementFiltersSchema.parse({
    category: typeof params.category === 'string' ? params.category : undefined,
    reviewYear: typeof params.reviewYear === 'string' ? params.reviewYear : undefined,
    sortBy: typeof params.sortBy === 'string' ? params.sortBy : undefined,
    sortOrder: typeof params.sortOrder === 'string' ? params.sortOrder : undefined,
    page: typeof params.page === 'string' ? params.page : undefined,
    pageSize: typeof params.pageSize === 'string' ? params.pageSize : undefined,
  });

  const { achievements, total, page, pageSize, totalPages } =
    await getAchievementsByUserPaged(userId, filters, fiscalYearStartMonth);

  const fyLabel = filters.reviewYear
    ? fiscalYearLabel(filters.reviewYear, fiscalYearStartMonth)
    : 'All years';

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Achievements</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {total} {total === 1 ? 'achievement' : 'achievements'}
            {filters.reviewYear ? ` · ${fyLabel}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons
            achievements={achievements}
            reviewYear={filters.reviewYear}
            fiscalYearStartMonth={fiscalYearStartMonth}
            category={filters.category}
          />
          <FiscalYearSettings currentMonth={fiscalYearStartMonth} />
          <Link
            href="/achievements/new"
            className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            + New achievement
          </Link>
        </div>
      </div>

      <Suspense>
        <AchievementFilters
          currentCategory={filters.category}
          currentReviewYear={filters.reviewYear}
          currentFiscalYear={fyNow}
          fiscalYearStartMonth={fiscalYearStartMonth}
          currentSortBy={filters.sortBy}
          currentSortOrder={filters.sortOrder}
          currentPageSize={filters.pageSize}
        />
      </Suspense>

      <AchievementList achievements={achievements} />

      <Suspense>
        <AchievementPagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} />
      </Suspense>
    </div>
  );
}
