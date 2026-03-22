'use client';

import { useRouter, useSearchParams } from 'next/navigation';

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
  { value: 'RESOLVED', label: 'Resolved' },
] as const;

const ACTIVE_CLS =
  'bg-teal-600 text-white dark:bg-zinc-50 dark:text-zinc-900';
const INACTIVE_CLS =
  'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200';

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
      <div className="flex items-center gap-1 rounded-lg border border-zinc-200 p-1 dark:border-zinc-700">
        {TYPE_FILTERS.map((f) => {
          const isActive = f.value === activeType;
          return (
            <button
              key={f.value ?? 'all-type'}
              type="button"
              onClick={() => navigate(f.value, activeStatus)}
              className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                isActive ? ACTIVE_CLS : INACTIVE_CLS
              }`}
              aria-pressed={isActive}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Status group */}
      <div className="flex items-center gap-1 rounded-lg border border-zinc-200 p-1 dark:border-zinc-700">
        {STATUS_FILTERS.map((f) => {
          const isActive = f.value === activeStatus;
          return (
            <button
              key={f.value ?? 'all-status'}
              type="button"
              onClick={() => navigate(activeType, f.value)}
              className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                isActive ? ACTIVE_CLS : INACTIVE_CLS
              }`}
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
