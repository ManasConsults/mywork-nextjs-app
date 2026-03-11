'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import type { Achievement } from '@prisma/client';

import { deleteAchievementAction } from '@/lib/actions/achievement';

type AchievementWithTask = Achievement & { task: { id: string; title: string } | null };

const CATEGORY_BADGE: Record<string, string> = {
  Leadership: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  Delivery: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  Innovation: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  Collaboration: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  Learning: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
};

function Stars({ rating }: { rating: number | null }): React.JSX.Element {
  if (rating == null) return <></>;
  return (
    <span className="text-sm" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={s <= rating ? 'text-amber-400' : 'text-zinc-300 dark:text-zinc-600'}>
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
      <div className="rounded-lg border border-dashed border-zinc-200 py-12 text-center dark:border-zinc-700">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No achievements recorded yet.</p>
        <Link
          href="/achievements/new"
          className="mt-3 inline-block text-sm font-medium text-teal-600 underline dark:text-teal-400"
        >
          Record your first achievement
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {achievements.map((a) => (
        <li
          key={a.id}
          className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900"
        >
          <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/achievements/${a.id}`}
                className="text-sm font-semibold text-zinc-900 hover:underline dark:text-zinc-50"
              >
                {a.title}
              </Link>
              {a.category && (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_BADGE[a.category] ?? 'bg-zinc-100 text-zinc-700'}`}
                >
                  {a.category}
                </span>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <Stars rating={a.impactRating} />
              <Link
                href={`/achievements/${a.id}`}
                className="text-xs text-zinc-500 underline hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                Edit
              </Link>
              <button
                onClick={() => handleDelete(a.id, a.title)}
                disabled={isPending}
                className="text-xs text-red-500 underline hover:text-red-700 disabled:opacity-50 dark:text-red-400"
              >
                Delete
              </button>
            </div>
          </div>

          {a.dateAchieved && (
            <p className="mb-1 text-xs text-zinc-500 dark:text-zinc-400">
              {new Date(a.dateAchieved).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          )}

          <p className="line-clamp-2 text-sm text-zinc-700 dark:text-zinc-300">
            {a.description}
          </p>

          {a.task && (
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              Linked to:{' '}
              <Link
                href={`/tasks/${a.task.id}`}
                className="text-teal-600 hover:underline dark:text-teal-400"
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
