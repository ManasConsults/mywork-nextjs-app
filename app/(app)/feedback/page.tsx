import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';
import { MessageSquarePlus } from 'lucide-react';

import { authOptions } from '@/lib/auth/auth';
import { getFeedbackSubmissionsByUser } from '@/lib/services/feedback.service';

export const metadata: Metadata = { title: 'MyWork — My Feedback' };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// ─── Type badge ───────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: string }): React.JSX.Element {
  if (type === 'BUG') {
    return (
      <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
        Bug
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700 dark:bg-teal-900/30 dark:text-teal-400">
      Feature Request
    </span>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }): React.JSX.Element {
  if (status === 'IN_REVIEW') {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
        In Review
      </span>
    );
  }
  if (status === 'RESOLVED') {
    return (
      <span className="inline-flex items-center rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700 dark:bg-teal-900/30 dark:text-teal-400">
        Resolved
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
      Open
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function FeedbackHistoryPage(): Promise<React.JSX.Element> {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const submissions = await getFeedbackSubmissionsByUser(session.user.id);
  const total = submissions.length;

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">My Feedback</h1>
          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
            {total} submission{total !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {total === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-200 bg-white py-16 dark:border-zinc-800 dark:bg-zinc-900">
          <MessageSquarePlus
            size={40}
            strokeWidth={1.5}
            className="text-zinc-300 dark:text-zinc-600"
            aria-hidden="true"
          />
          <p className="mt-3 text-sm font-medium text-zinc-500 dark:text-zinc-400">
            No feedback submitted yet
          </p>
          <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
            Use the Feedback button in the header to share ideas or report bugs.
          </p>
        </div>
      ) : (
        /* Submission list */
        <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800">
          {submissions.map((s, i) => (
            <div
              key={s.id}
              className="flex items-start gap-3 px-4 py-3 motion-safe:animate-[fadeIn_200ms_ease-out_both]"
              style={{ animationDelay: `${Math.min(i, 5) * 30}ms` }}
            >
              <TypeBadge type={s.type} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {s.title}
                </p>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  {s.module} · {formatDate(s.createdAt)}
                </p>
              </div>
              <StatusBadge status={s.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
