import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';

import { authOptions } from '@/lib/auth/auth';
import { getFeedbackSubmissionsByUser } from '@/lib/services/feedback.service';

export const metadata: Metadata = { title: 'MyWork — My Feedback' };

// ─── Type badge ───────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: string }): React.JSX.Element {
  if (type === 'BUG') {
    return (
      <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
        Bug
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-700 dark:bg-teal-900/30 dark:text-teal-400">
      Feature Request
    </span>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }): React.JSX.Element {
  if (status === 'IN_REVIEW') {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
        In Review
      </span>
    );
  }
  if (status === 'RESOLVED') {
    return (
      <span className="inline-flex items-center rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-700 dark:bg-teal-900/30 dark:text-teal-400">
        Resolved
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
      Open
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function FeedbackHistoryPage(): Promise<React.JSX.Element> {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const submissions = await getFeedbackSubmissionsByUser(session.user.id);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">My Feedback</h1>
        <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
          Your submitted feedback and feature requests.
        </p>
      </div>

      {submissions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-200 bg-white py-16 dark:border-zinc-800 dark:bg-zinc-900">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-zinc-300 dark:text-zinc-600"
            aria-hidden="true"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <p className="mt-3 text-sm font-medium text-zinc-500 dark:text-zinc-400">
            No feedback submitted yet
          </p>
          <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
            Use the Feedback button in the header to share ideas or report bugs.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Type
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Title
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Module
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Date
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s, index) => {
                const isEven = index % 2 === 0;
                const rowBg = isEven
                  ? 'bg-white dark:bg-zinc-900'
                  : 'bg-zinc-50 dark:bg-zinc-800/50';
                return (
                  <tr key={s.id} className={rowBg}>
                    <td className="border-t border-zinc-100 px-4 py-3 dark:border-zinc-800">
                      <TypeBadge type={s.type} />
                    </td>
                    <td className="border-t border-zinc-100 px-4 py-3 text-sm text-zinc-900 dark:border-zinc-800 dark:text-zinc-50">
                      {s.title}
                    </td>
                    <td className="border-t border-zinc-100 px-4 py-3 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                      {s.module}
                    </td>
                    <td className="border-t border-zinc-100 px-4 py-3 text-sm text-zinc-500 tabular-nums dark:border-zinc-800 dark:text-zinc-400">
                      {s.createdAt.toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="border-t border-zinc-100 px-4 py-3 dark:border-zinc-800">
                      <StatusBadge status={s.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
