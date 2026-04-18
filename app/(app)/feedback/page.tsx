import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';

import { authOptions } from '@/lib/auth/auth';
import { FeedbackListServer } from './_components/FeedbackListServer';
import { FeedbackListSkeleton } from './_components/FeedbackListSkeleton';

export const metadata: Metadata = { title: 'MyWork — My Feedback' };

export default async function FeedbackHistoryPage(): Promise<React.JSX.Element> {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 flex flex-col gap-6">
      <Suspense fallback={<FeedbackListSkeleton />}>
        <FeedbackListServer userId={session.user.id} />
      </Suspense>
    </div>
  );
}
