import Link from 'next/link';
import { MessageSquarePlus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Suspense } from 'react';

import { getFeedbackSubmissionsByUser } from '@/lib/services/feedback.service';
import type { FeedbackType, FeedbackStatus } from '@prisma/client';
import { DeleteFeedbackButton } from './DeleteFeedbackButton';
import { FeedbackFilters } from './FeedbackFilters';

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function TypeBadge({ type }: { type: string }): React.JSX.Element {
  if (type === 'BUG') {
    return (
      <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
        Bug
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-primary/5 px-2 py-0.5 text-xs font-medium text-primary">
      Feature Request
    </span>
  );
}

function StatusBadge({ status }: { status: string }): React.JSX.Element {
  if (status === 'IN_REVIEW') {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
        In Review
      </span>
    );
  }
  if (status === 'DEFERRED') {
    return (
      <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
        Deferred
      </span>
    );
  }
  if (status === 'RESOLVED') {
    return (
      <span className="inline-flex items-center rounded-full bg-primary/5 px-2 py-0.5 text-xs font-medium text-primary">
        Resolved
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
      Open
    </span>
  );
}

const PAGE_SIZE = 10;

const VALID_TYPES = new Set<FeedbackType>(['BUG', 'FEATURE_REQUEST']);
const VALID_STATUSES = new Set<FeedbackStatus>(['OPEN', 'IN_REVIEW', 'DEFERRED', 'RESOLVED']);

interface FeedbackListServerProps {
  userId: string;
  type: string;
  status: string;
  page: number;
}

export async function FeedbackListServer({
  userId,
  type,
  status,
  page,
}: FeedbackListServerProps): Promise<React.JSX.Element> {
  // 'all' = user explicitly chose no filter; anything else falls through to VALID_TYPES check
  const filterType = type === 'all' ? undefined : VALID_TYPES.has(type as FeedbackType) ? (type as FeedbackType) : undefined;
  const filterStatus = status === 'all' ? undefined : VALID_STATUSES.has(status as FeedbackStatus) ? (status as FeedbackStatus) : undefined;

  const result = await getFeedbackSubmissionsByUser(userId, {
    type: filterType,
    status: filterStatus,
    page,
    pageSize: PAGE_SIZE,
  });

  const { items, total, totalPages } = result;

  function pageHref(p: number): string {
    const params = new URLSearchParams();
    if (type) params.set('type', type);
    if (status) params.set('status', status);
    if (p > 1) params.set('page', String(p));
    const qs = params.toString();
    return qs ? `?${qs}` : '?';
  }

  return (
    <>
      <Suspense>
        <FeedbackFilters currentType={type} currentStatus={status} />
      </Suspense>

      <p className="text-sm text-muted-foreground">
        {total} submission{total !== 1 ? 's' : ''}
        {totalPages > 1 && ` · page ${page} of ${totalPages}`}
      </p>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16">
          <MessageSquarePlus
            size={40}
            strokeWidth={1.5}
            className="text-muted-foreground/40"
            aria-hidden="true"
          />
          <p className="mt-3 text-sm font-medium text-muted-foreground">
            No feedback found
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Try adjusting your filters or submit new feedback from the header.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card divide-y divide-border/60">
          {items.map((s, i) => (
            <div
              key={s.id}
              className="flex items-start gap-3 px-4 py-3 motion-safe:animate-[fadeIn_200ms_ease-out_both]"
              style={{ animationDelay: `${Math.min(i, 5) * 30}ms` }}
            >
              <TypeBadge type={s.type} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {s.title}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {s.module} · {formatDate(s.createdAt)}
                </p>
              </div>
              <StatusBadge status={s.status} />
              <DeleteFeedbackButton id={s.id} />
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
          </p>
          <div className="flex items-center gap-1">
            <Link
              href={pageHref(page - 1)}
              aria-label="Previous page"
              aria-disabled={page <= 1}
              className={`inline-flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground ${page <= 1 ? 'pointer-events-none opacity-40' : ''}`}
            >
              <ChevronLeft size={14} />
            </Link>
            <Link
              href={pageHref(page + 1)}
              aria-label="Next page"
              aria-disabled={page >= totalPages}
              className={`inline-flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground ${page >= totalPages ? 'pointer-events-none opacity-40' : ''}`}
            >
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
