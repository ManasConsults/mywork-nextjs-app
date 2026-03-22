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
  const total = submissions.length;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Feedback</h1>
          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
            {total} submission{total !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Filter bar — client component, needs Suspense for useSearchParams */}
      <Suspense>
        <FeedbackFiltersBar activeType={activeType} activeStatus={activeStatus} />
      </Suspense>

      {/* Table */}
      <FeedbackTable initialRows={rows} />
    </div>
  );
}
