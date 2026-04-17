import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import type { FeedbackType, FeedbackStatus } from '@prisma/client';

import { authOptions } from '@/lib/auth/auth';
import { getAllFeedbackSubmissions } from '@/lib/services/feedback.service';
import { feedbackFiltersSchema } from '@/lib/schemas/feedback.schema';
import { FeedbackTable } from './_components/FeedbackTable';
import { FeedbackFiltersBar } from './_components/FeedbackFiltersBar';
import type { FeedbackRow } from './_components/FeedbackTable';

export const metadata: Metadata = { title: 'MyWork Admin — Feedback' };

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminFeedbackPage({ searchParams }: PageProps): Promise<React.JSX.Element> {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string }).role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const rawParams = await searchParams;

  const parsed = feedbackFiltersSchema.safeParse({
    type: rawParams['type'],
    status: rawParams['status'],
  });

  const filters = parsed.success ? parsed.data : {};

  const submissions = await getAllFeedbackSubmissions({
    type: filters.type as FeedbackType | undefined,
    status: filters.status as FeedbackStatus | undefined,
  });

  const rows: FeedbackRow[] = submissions.map((s) => ({
    id: s.id,
    type: s.type,
    status: s.status,
    title: s.title,
    description: s.description,
    module: s.module,
    createdAt: s.createdAt.toISOString(),
    user: s.user,
  }));

  const activeType = filters.type ?? null;
  const activeStatus = filters.status ?? null;

  return (
    <div className="space-y-6">
      {/* Filter bar — client component, needs Suspense for useSearchParams */}
      <Suspense>
        <FeedbackFiltersBar activeType={activeType} activeStatus={activeStatus} />
      </Suspense>

      {/* Table */}
      <FeedbackTable initialRows={rows} />
    </div>
  );
}
