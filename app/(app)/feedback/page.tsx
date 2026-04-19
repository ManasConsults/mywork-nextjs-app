import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';

import { authOptions } from '@/lib/auth/auth';
import { FeedbackListServer } from './_components/FeedbackListServer';
import { FeedbackListSkeleton } from './_components/FeedbackListSkeleton';

export const metadata: Metadata = { title: 'MyWork — My Feedback' };

interface FeedbackHistoryPageProps {
  searchParams: Promise<{
    type?: string;
    status?: string;
    page?: string;
  }>;
}

export default async function FeedbackHistoryPage({
  searchParams,
}: FeedbackHistoryPageProps): Promise<React.JSX.Element> {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const params = await searchParams;
  // 'all' sentinel means the user explicitly cleared the filter; absent means first-load default
  const type = params.type === 'all' ? 'all' : (params.type ?? 'BUG');
  const status = params.status === 'all' ? 'all' : (params.status ?? 'OPEN');
  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1);

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 flex flex-col gap-6">
      <Suspense fallback={<FeedbackListSkeleton />}>
        <FeedbackListServer
          userId={session.user.id}
          type={type}
          status={status}
          page={page}
        />
      </Suspense>
    </div>
  );
}
