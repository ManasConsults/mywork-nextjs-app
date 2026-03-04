import { Suspense } from 'react';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';

import { authOptions } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { getAchievementsByUser } from '@/lib/services/achievement.service';
import { currentFiscalYear, fiscalYearLabel } from '@/lib/utils/fiscal-year';
import type { AchievementFilters as AchievementFiltersType } from '@/lib/schemas/achievement.schema';
import { ACHIEVEMENT_CATEGORIES } from '@/lib/schemas/achievement.schema';
import { AchievementFilters } from './_components/AchievementFilters';
import { AchievementList } from './_components/AchievementList';
import { FiscalYearSettings } from './_components/FiscalYearSettings';
import { ExportButtons } from './_components/ExportButtons';

export const metadata: Metadata = { title: 'MyWork — Achievements' };

interface AchievementsPageProps {
  searchParams: Promise<{ category?: string; reviewYear?: string }>;
}

export default async function AchievementsPage({ searchParams }: AchievementsPageProps): Promise<React.JSX.Element> {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const { category, reviewYear: reviewYearStr } = await searchParams;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { fiscalYearStartMonth: true },
  });
  const fiscalYearStartMonth = user?.fiscalYearStartMonth ?? 4;
  const fyNow = currentFiscalYear(fiscalYearStartMonth);
  const reviewYear = reviewYearStr ? Number(reviewYearStr) : undefined;

  const validCategory = ACHIEVEMENT_CATEGORIES.includes(category as typeof ACHIEVEMENT_CATEGORIES[number])
    ? (category as typeof ACHIEVEMENT_CATEGORIES[number])
    : undefined;

  const filters: AchievementFiltersType = {
    ...(validCategory ? { category: validCategory } : {}),
    ...(reviewYear ? { reviewYear } : {}),
  };

  const achievements = await getAchievementsByUser(userId, filters, fiscalYearStartMonth);

  const fyLabel = reviewYear
    ? fiscalYearLabel(reviewYear, fiscalYearStartMonth)
    : 'All years';

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Achievements</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {achievements.length} {achievements.length === 1 ? 'achievement' : 'achievements'}
            {reviewYear ? ` · ${fyLabel}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons
            achievements={achievements}
            reviewYear={reviewYear}
            fiscalYearStartMonth={fiscalYearStartMonth}
            category={category}
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
          currentCategory={category}
          currentReviewYear={reviewYear}
          currentFiscalYear={fyNow}
          fiscalYearStartMonth={fiscalYearStartMonth}
        />
      </Suspense>

      <AchievementList achievements={achievements} />
    </div>
  );
}
