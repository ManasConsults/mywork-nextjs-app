'use client';

import { useRouter, useSearchParams } from 'next/navigation';

import { cn } from '@/lib/utils';

interface FeedbackFiltersBarProps {
  activeType: string;
  activeStatus: string;
  pageSize: number;
}

const TYPE_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'FEATURE_REQUEST', label: 'Feature' },
  { value: 'BUG', label: 'Bug' },
] as const;

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_REVIEW', label: 'In Review' },
  { value: 'DEFERRED', label: 'Deferred' },
  { value: 'RESOLVED', label: 'Resolved' },
] as const;

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

const ACTIVE_CLS = 'bg-primary text-primary-foreground';
const INACTIVE_CLS = 'text-muted-foreground hover:text-foreground';

export function FeedbackFiltersBar({
  activeType,
  activeStatus,
  pageSize,
}: FeedbackFiltersBarProps): React.JSX.Element {
  const router = useRouter();
  useSearchParams();

  function buildHref(type: string, status: string, size: number, pg = 1): string {
    const params = new URLSearchParams();
    params.set('type', type);
    params.set('status', status);
    if (size !== 10) params.set('pageSize', String(size));
    if (pg > 1) params.set('page', String(pg));
    return `/admin/feedback?${params.toString()}`;
  }

  function navigate(type: string, status: string, size = pageSize) {
    router.push(buildHref(type, status, size));
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap sm:justify-between">
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

      {/* Page size selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Per page</span>
        <div className="flex items-center gap-1 rounded-lg border border-border p-1">
          {PAGE_SIZE_OPTIONS.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => navigate(activeType, activeStatus, size)}
              className={cn(
                'rounded-md px-2.5 py-1 text-sm font-medium transition-colors',
                size === pageSize ? ACTIVE_CLS : INACTIVE_CLS,
              )}
              aria-pressed={size === pageSize}
            >
              {size}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
