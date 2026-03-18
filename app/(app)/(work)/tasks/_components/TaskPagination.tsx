'use client';

import { useRouter, useSearchParams } from 'next/navigation';

interface TaskPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
}

export function TaskPagination({
  page,
  totalPages,
  total,
  pageSize,
}: TaskPaginationProps): React.JSX.Element | null {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(p));
    router.push(`/tasks?${params.toString()}`);
  }

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const pages = buildPageRange(page, totalPages);

  return (
    <div className="mt-4 flex items-center justify-between text-sm">
      <p className="text-zinc-500 dark:text-zinc-400">
        {from}–{to} of {total}
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => goToPage(page - 1)}
          disabled={page <= 1}
          className="rounded-md border border-zinc-200 px-2.5 py-1.5 text-zinc-600 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          aria-label="Previous page"
        >
          ‹
        </button>

        {pages.map((p, i) =>
          p === null ? (
            <span key={`ellipsis-${i}`} className="px-1 text-zinc-400">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => goToPage(p)}
              aria-current={p === page ? 'page' : undefined}
              className={`rounded-md border px-2.5 py-1.5 transition-colors ${
                p === page
                  ? 'border-teal-600 bg-teal-600 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-900'
                  : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800'
              }`}
            >
              {p}
            </button>
          ),
        )}

        <button
          onClick={() => goToPage(page + 1)}
          disabled={page >= totalPages}
          className="rounded-md border border-zinc-200 px-2.5 py-1.5 text-zinc-600 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          aria-label="Next page"
        >
          ›
        </button>
      </div>
    </div>
  );
}

function buildPageRange(current: number, total: number): (number | null)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | null)[] = [1];

  if (current > 3) pages.push(null);

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let p = start; p <= end; p++) pages.push(p);

  if (current < total - 2) pages.push(null);

  pages.push(total);
  return pages;
}
