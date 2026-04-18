'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import type { Achievement } from '@prisma/client';

import { cn } from '@/lib/utils';
import { deleteAchievementAction } from '@/lib/actions/achievement';
import { Button } from '@/components/ui/button';

type AchievementWithTask = Achievement & { task: { id: string; title: string } | null };

const CATEGORY_BADGE: Record<string, string> = {
  Leadership: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  Delivery: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  Innovation: 'bg-primary/10 text-primary',
  Collaboration: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  Learning: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
};

function Stars({ rating }: { rating: number | null }): React.JSX.Element {
  if (rating == null) return <></>;
  return (
    <span className="text-sm" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={s <= rating ? 'text-amber-400' : 'text-muted-foreground/40'}>
          ★
        </span>
      ))}
    </span>
  );
}

export function AchievementList({
  achievements,
}: {
  achievements: AchievementWithTask[];
}): React.JSX.Element {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    startTransition(async () => {
      await deleteAchievementAction(id);
      router.refresh();
    });
  }

  if (achievements.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border py-12 text-center">
        <p className="text-sm text-muted-foreground">No achievements recorded yet.</p>
        <Link
          href="/achievements/new"
          className="mt-3 inline-block text-sm font-medium text-primary underline"
        >
          Record your first achievement
        </Link>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {achievements.map((a) => (
        <li
          key={a.id}
          className="rounded-lg border border-border bg-card p-4"
        >
          <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/achievements/${a.id}`}
                className="text-sm font-semibold text-foreground hover:underline"
              >
                {a.title}
              </Link>
              {a.category && (
                <span
                  className={cn('rounded-full px-2 py-0.5 text-xs font-medium', CATEGORY_BADGE[a.category] ?? 'bg-muted text-foreground')}
                >
                  {a.category}
                </span>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <Stars rating={a.impactRating} />
              <Link
                href={`/achievements/${a.id}`}
                className="text-xs text-muted-foreground underline hover:text-foreground"
              >
                Edit
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(a.id, a.title)}
                disabled={isPending}
                className="h-auto p-0 text-xs text-red-500 underline hover:text-red-700 hover:bg-transparent dark:text-red-400"
              >
                Delete
              </Button>
            </div>
          </div>

          {a.dateAchieved && (
            <p className="mb-1 text-xs text-muted-foreground">
              {new Date(a.dateAchieved).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          )}

          <p className="line-clamp-2 text-sm text-foreground">
            {a.description}
          </p>

          {a.task && (
            <p className="mt-2 text-xs text-muted-foreground">
              Linked to:{' '}
              <Link
                href={`/tasks/${a.task.id}`}
                className="text-primary hover:underline"
              >
                {a.task.title}
              </Link>
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
