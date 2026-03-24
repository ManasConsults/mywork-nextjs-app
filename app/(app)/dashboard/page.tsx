import Link from 'next/link';
import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';

import { authOptions } from '@/lib/auth/auth';
import { GlobalSearch } from './_components/GlobalSearch';
import { DashboardStatsServer } from './_components/DashboardStatsServer';
import { DashboardStatsSkeleton } from './_components/DashboardStatsSkeleton';

export const metadata: Metadata = { title: 'MyWork — Dashboard' };

export default async function DashboardPage(): Promise<React.JSX.Element> {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Dashboard</h1>

      <div className="mt-6">
        <GlobalSearch />
      </div>

      <Suspense fallback={<DashboardStatsSkeleton />}>
        <DashboardStatsServer userId={userId} />
      </Suspense>

      <div className="mt-10">
        <Link
          href="/tasks"
          className="inline-flex items-center rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Go to Tasks
        </Link>
      </div>
    </div>
  );
}
