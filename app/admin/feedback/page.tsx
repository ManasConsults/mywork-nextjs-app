import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';
import Link from 'next/link';
import type { FeedbackType, FeedbackStatus } from '@prisma/client';

import { authOptions } from '@/lib/auth/auth';
import { getAllFeedbackSubmissions } from '@/lib/services/feedback.service';
import { feedbackFiltersSchema } from '@/lib/schemas/feedback.schema';
import { FeedbackTable } from './_components/FeedbackTable';
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

  // Serialise Date objects for client component
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

  function filterHref(type: string | null, status: string | null): string {
    const params = new URLSearchParams();
    if (type) params.set('type', type);
    if (status) params.set('status', status);
    const qs = params.toString();
    return `/admin/feedback${qs ? `?${qs}` : ''}`;
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Feedback</h1>
        <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
          {submissions.length} submission{submissions.length !== 1 ? 's' : ''} total
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        {/* Type filter */}
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Type</p>
          <div className="flex gap-1.5">
            <Link
              href={filterHref(null, activeStatus)}
              className={`rounded-md border px-2.5 py-1 text-sm font-medium transition-colors ${
                !activeType
                  ? 'border-teal-500 bg-teal-50 text-teal-700'
                  : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'
              }`}
            >
              All
            </Link>
            <Link
              href={filterHref('FEATURE_REQUEST', activeStatus)}
              className={`rounded-md border px-2.5 py-1 text-sm font-medium transition-colors ${
                activeType === 'FEATURE_REQUEST'
                  ? 'border-teal-500 bg-teal-50 text-teal-700'
                  : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'
              }`}
            >
              Feature Requests
            </Link>
            <Link
              href={filterHref('BUG', activeStatus)}
              className={`rounded-md border px-2.5 py-1 text-sm font-medium transition-colors ${
                activeType === 'BUG'
                  ? 'border-teal-500 bg-teal-50 text-teal-700'
                  : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'
              }`}
            >
              Bugs
            </Link>
          </div>
        </div>

        {/* Status filter */}
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Status</p>
          <div className="flex gap-1.5">
            <Link
              href={filterHref(activeType, null)}
              className={`rounded-md border px-2.5 py-1 text-sm font-medium transition-colors ${
                !activeStatus
                  ? 'border-teal-500 bg-teal-50 text-teal-700'
                  : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'
              }`}
            >
              All
            </Link>
            {(['OPEN', 'IN_REVIEW', 'RESOLVED'] as const).map((s) => (
              <Link
                key={s}
                href={filterHref(activeType, s)}
                className={`rounded-md border px-2.5 py-1 text-sm font-medium transition-colors ${
                  activeStatus === s
                    ? 'border-teal-500 bg-teal-50 text-teal-700'
                    : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'
                }`}
              >
                {s === 'IN_REVIEW' ? 'In Review' : s === 'RESOLVED' ? 'Resolved' : 'Open'}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <FeedbackTable initialRows={rows} />
    </div>
  );
}
