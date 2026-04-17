import { MessageSquarePlus } from 'lucide-react';

import { getFeedbackSubmissionsByUser } from '@/lib/services/feedback.service';
import { DeleteFeedbackButton } from './DeleteFeedbackButton';

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
    <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:text-zinc-300">
      Open
    </span>
  );
}

export async function FeedbackListServer({
  userId,
}: {
  userId: string;
}): Promise<React.JSX.Element> {
  const submissions = await getFeedbackSubmissionsByUser(userId);
  const total = submissions.length;

  return (
    <>
      <p className="mt-0.5 text-sm text-muted-foreground">
        {total} submission{total !== 1 ? 's' : ''}
      </p>

      {total === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16">
          <MessageSquarePlus
            size={40}
            strokeWidth={1.5}
            className="text-zinc-300 dark:text-zinc-600"
            aria-hidden="true"
          />
          <p className="mt-3 text-sm font-medium text-muted-foreground">
            No feedback submitted yet
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Use the Feedback button in the header to share ideas or report bugs.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card divide-y divide-border/60">
          {submissions.map((s, i) => (
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
    </>
  );
}
