'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

const TYPE_OPTIONS = [
  { label: 'All types', value: 'all' },
  { label: 'Bugs', value: 'BUG' },
  { label: 'Feature requests', value: 'FEATURE_REQUEST' },
] as const;

const STATUS_OPTIONS = [
  { label: 'All statuses', value: 'all' },
  { label: 'Open', value: 'OPEN' },
  { label: 'In Review', value: 'IN_REVIEW' },
  { label: 'Deferred', value: 'DEFERRED' },
  { label: 'Resolved', value: 'RESOLVED' },
] as const;

interface FeedbackFiltersProps {
  currentType: string;
  currentStatus: string;
}

export function FeedbackFilters({
  currentType,
  currentStatus,
}: FeedbackFiltersProps): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();

  function navigate(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    params.delete('page');
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <div
        role="group"
        aria-label="Filter by type"
        className="flex items-center gap-0.5 rounded-xl border border-border/60 bg-muted/50 p-1"
      >
        {TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => navigate('type', opt.value)}
            className={cn(
              'rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-150 active:scale-[0.97]',
              currentType === opt.value
                ? 'bg-background text-foreground shadow-sm shadow-black/8 dark:shadow-black/30'
                : 'text-foreground/60 hover:bg-accent/60 hover:text-foreground',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div
        role="group"
        aria-label="Filter by status"
        className="flex items-center gap-0.5 rounded-xl border border-border/60 bg-muted/50 p-1"
      >
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => navigate('status', opt.value)}
            className={cn(
              'rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-150 active:scale-[0.97]',
              currentStatus === opt.value
                ? 'bg-background text-foreground shadow-sm shadow-black/8 dark:shadow-black/30'
                : 'text-foreground/60 hover:bg-accent/60 hover:text-foreground',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
