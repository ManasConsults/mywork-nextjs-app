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

const VALID_PAGE_SIZES = [10, 20, 50] as const;
type ValidPageSize = (typeof VALID_PAGE_SIZES)[number];

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminFeedbackPage({ searchParams }: PageProps): Promise<React.JSX.Element> {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string }).role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const rawParams = await searchParams;

  // Coerce string | string[] | undefined → string
  const rawType = Array.isArray(rawParams['type']) ? rawParams['type'][0] : rawParams['type'];
  const rawStatus = Array.isArray(rawParams['status']) ? rawParams['status'][0] : rawParams['status'];
  // 'all' = explicit "no filter"; absent = first-load default (OPEN)
  const activeType = rawType === 'all' ? 'all' : (rawType ?? 'all');
  const activeStatus = rawStatus === 'all' ? 'all' : (rawStatus ?? 'OPEN');

  const parsed = feedbackFiltersSchema.safeParse({
    type: activeType === 'all' ? undefined : activeType,
    status: activeStatus === 'all' ? undefined : activeStatus,
  });

  const filters = parsed.success ? parsed.data : {};

  const rawPageSize = parseInt(String(rawParams['pageSize'] ?? '10'), 10);
  const pageSize: ValidPageSize = (VALID_PAGE_SIZES as readonly number[]).includes(rawPageSize)
    ? (rawPageSize as ValidPageSize)
    : 10;
  const page = Math.max(1, parseInt(String(rawParams['page'] ?? '1'), 10) || 1);

  const result = await getAllFeedbackSubmissions(
    {
      type: filters.type as FeedbackType | undefined,
      status: filters.status as FeedbackStatus | undefined,
    },
    { page, pageSize },
  );

  const rows: FeedbackRow[] = result.items.map((s) => ({
    id: s.id,
    type: s.type,
    status: s.status,
    title: s.title,
    description: s.description,
    module: s.module,
    createdAt: s.createdAt.toISOString(),
    user: s.user,
  }));

  return (
    <div className="flex flex-col gap-6">
      <Suspense>
        <FeedbackFiltersBar
          activeType={activeType}
          activeStatus={activeStatus}
          pageSize={pageSize}
        />
      </Suspense>

      <FeedbackTable
        key={`${activeType}-${activeStatus}-${page}-${pageSize}`}
        initialRows={rows}
        total={result.total}
        page={result.page}
        pageSize={result.pageSize}
        totalPages={result.totalPages}
        activeType={activeType}
        activeStatus={activeStatus}
      />
    </div>
  );
}
