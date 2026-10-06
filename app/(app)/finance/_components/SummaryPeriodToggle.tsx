'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

const PERIOD_OPTIONS = [
  { label: 'Day', value: 'day' },
  { label: 'Month', value: 'month' },
  { label: 'FY', value: 'fy' },
] as const;

export type SummaryPeriod = (typeof PERIOD_OPTIONS)[number]['value'];

export function SummaryPeriodToggle({ current }: { current: SummaryPeriod }): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();

  function select(value: SummaryPeriod) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('period', value);
    router.push(`?${params.toString()}`, { scroll: false });
  }

  return (
    <div
      role="group"
      aria-label="Summary period"
      className="flex items-center gap-0.5 rounded-xl border border-border/60 bg-muted/50 p-1"
    >
      {PERIOD_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          aria-pressed={current === opt.value}
          onClick={() => select(opt.value)}
          className={cn(
            'min-h-[44px] rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 active:scale-[0.97] sm:min-h-0',
            current === opt.value
              ? 'bg-background text-foreground shadow-sm shadow-black/8 dark:shadow-black/30'
              : 'text-foreground/60 hover:bg-accent/60 hover:text-foreground',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
