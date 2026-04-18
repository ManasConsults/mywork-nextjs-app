'use client';

import { useRouter, useSearchParams } from 'next/navigation';

import { cn } from '@/lib/utils';

interface FeedbackFiltersBarProps {
  activeType: string | null;
  activeStatus: string | null;
}

const TYPE_FILTERS = [
  { value: null, label: 'All' },
  { value: 'FEATURE_REQUEST', label: 'Feature' },
  { value: 'BUG', label: 'Bug' },
] as const;

const STATUS_FILTERS = [
  { value: null, label: 'All' },
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_REVIEW', label: 'In Review' },
  { value: 'DEFERRED', label: 'Deferred' },
  { value: 'RESOLVED', label: 'Resolved' },
] as const;

const ACTIVE_CLS = 'bg-primary text-primary-foreground';
const INACTIVE_CLS = 'text-muted-foreground hover:text-foreground';

function buildHref(type: string | null, status: string | null): string {
  const params = new URLSearchParams();
  if (type) params.set('type', type);
  if (status) params.set('status', status);
  const qs = params.toString();
  return `/admin/feedback${qs ? `?${qs}` : ''}`;
}

export function FeedbackFiltersBar({
  activeType,
  activeStatus,
}: FeedbackFiltersBarProps): React.JSX.Element {
  const router = useRouter();
  // searchParams kept in scope so this component re-renders on URL change
  useSearchParams();

  function navigate(type: string | null, status: string | null) {
    router.push(buildHref(type, status));
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
      {/* Type group */}
      <div className="flex items-center gap-1 rounded-lg border border-border p-1">
        {TYPE_FILTERS.map((f) => {
          const isActive = f.value === activeType;
          return (
            <button
              key={f.value ?? 'all-type'}
              type="button"
              onClick={() => navigate(f.value, activeStatus)}
              className={cn('rounded-md px-3 py-1 text-sm font-medium transition-colors', isActive ? ACTIVE_CLS : INACTIVE_CLS)}
              aria-pressed={isActive}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Status group */}
      <div className="flex items-center gap-1 rounded-lg border border-border p-1">
        {STATUS_FILTERS.map((f) => {
          const isActive = f.value === activeStatus;
          return (
            <button
              key={f.value ?? 'all-status'}
              type="button"
              onClick={() => navigate(activeType, f.value)}
              className={cn('rounded-md px-3 py-1 text-sm font-medium transition-colors', isActive ? ACTIVE_CLS : INACTIVE_CLS)}
              aria-pressed={isActive}
            >
              {f.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
