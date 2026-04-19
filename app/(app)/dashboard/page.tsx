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
      <div className="mt-6">
        <GlobalSearch />
      </div>

      <Suspense fallback={<DashboardStatsSkeleton />}>
        <DashboardStatsServer userId={userId} />
      </Suspense>

      <div className="mt-10">
        <Link
          href="/tasks"
          className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Go to Tasks
        </Link>
      </div>
    </div>
  );
}
