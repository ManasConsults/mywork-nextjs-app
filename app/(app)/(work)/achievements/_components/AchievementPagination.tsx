'use client';

import { useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';

interface AchievementPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
}

export function AchievementPagination({
  page,
  totalPages,
  total,
  pageSize,
}: AchievementPaginationProps): React.JSX.Element | null {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(p));
    router.push(`/achievements?${params.toString()}`);
  }

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const pages = buildPageRange(page, totalPages);

  return (
    <div className="mt-4 flex items-center justify-between text-sm">
      <p className="text-muted-foreground">
        {from}–{to} of {total}
      </p>

      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" onClick={() => goToPage(page - 1)} disabled={page <= 1} aria-label="Previous page">
          ‹
        </Button>

        {pages.map((p, i) =>
          p === null ? (
            <span key={`ellipsis-${i}`} className="px-1 text-zinc-400">…</span>
          ) : (
            <Button
              key={p}
              variant={p === page ? 'default' : 'outline'}
              size="sm"
              onClick={() => goToPage(p)}
              aria-current={p === page ? 'page' : undefined}
              className={p === page ? 'bg-primary text-white hover:bg-primary/90 border-primary dark:bg-accent/40 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:border-zinc-50' : ''}
            >
              {p}
            </Button>
          ),
        )}

        <Button variant="outline" size="sm" onClick={() => goToPage(page + 1)} disabled={page >= totalPages} aria-label="Next page">
          ›
        </Button>
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
