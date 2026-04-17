import { Suspense } from 'react';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';

import { authOptions } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { currentFiscalYear } from '@/lib/utils/fiscal-year';
import { achievementFiltersSchema } from '@/lib/schemas/achievement.schema';
import { AchievementFilters } from './_components/AchievementFilters';
import { AchievementListServer } from './_components/AchievementListServer';
import { FiscalYearSettings } from './_components/FiscalYearSettings';

export const metadata: Metadata = { title: 'MyWork — Achievements' };

interface AchievementsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function AchievementListSkeleton(): React.JSX.Element {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-lg border border-border bg-card p-4"
        >
          <div className="mb-2 flex items-start justify-between gap-2">
            <div className="flex gap-2">
              <div className="h-4 w-40 rounded bg-muted" />
              <div className="h-4 w-20 rounded-full bg-muted" />
            </div>
            <div className="h-4 w-24 rounded bg-muted" />
          </div>
          <div className="h-3 w-24 rounded bg-muted mb-2" />
          <div className="space-y-1.5">
            <div className="h-3 w-full rounded bg-muted" />
            <div className="h-3 w-4/5 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function AchievementsPage({ searchParams }: AchievementsPageProps): Promise<React.JSX.Element> {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const params = await searchParams;

  // Fast PK lookup — needed for filter UI and AchievementListServer
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

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <FiscalYearSettings currentMonth={fiscalYearStartMonth} />
          <Link
            href="/achievements/new"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
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

      <Suspense fallback={<AchievementListSkeleton />}>
        <AchievementListServer userId={userId} filters={filters} fiscalYearStartMonth={fiscalYearStartMonth} />
      </Suspense>
    </div>
  );
}
