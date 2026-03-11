'use client';

import { useRouter, useSearchParams } from 'next/navigation';

interface ClientOption {
  id: string;
  name: string;
}

interface TimesheetFiltersProps {
  clients: ClientOption[];
  currentClientId?: string;
  currentFrom?: string;
  currentTo?: string;
  currentStatus?: string;
}

const selectCls =
  'rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300';

const inputCls =
  'rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300';

const STATUS_OPTIONS = [
  { value: 'unbilled', label: 'Unbilled' },
  { value: 'billed', label: 'Billed' },
  { value: 'all', label: 'All' },
] as const;

export function TimesheetFilters({
  clients,
  currentClientId,
  currentFrom,
  currentTo,
  currentStatus,
}: TimesheetFiltersProps): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string): void {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/finance/timesheets?${params.toString()}`);
  }

  function clearFilters(): void {
    router.push('/finance/timesheets');
  }

  const hasActiveFilters =
    !!currentClientId ||
    !!currentFrom ||
    !!currentTo ||
    (!!currentStatus && currentStatus !== 'unbilled');

  return (
    <div className="mb-5 flex flex-wrap items-center gap-3">
      {/* Client filter */}
      <select
        value={currentClientId ?? ''}
        onChange={(e) => updateParam('clientId', e.target.value)}
        className={selectCls}
        aria-label="Filter by client"
      >
        <option value="">All clients</option>
        {clients.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      {/* Date range */}
      <div className="flex items-center gap-2">
        <label className="text-sm text-zinc-500 dark:text-zinc-400">From</label>
        <input
          type="date"
          value={currentFrom ?? ''}
          onChange={(e) => updateParam('from', e.target.value)}
          className={inputCls}
          aria-label="From date"
        />
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm text-zinc-500 dark:text-zinc-400">To</label>
        <input
          type="date"
          value={currentTo ?? ''}
          onChange={(e) => updateParam('to', e.target.value)}
          className={inputCls}
          aria-label="To date"
        />
      </div>

      {/* Billing status */}
      <select
        value={currentStatus ?? 'unbilled'}
        onChange={(e) => updateParam('status', e.target.value)}
        className={selectCls}
        aria-label="Filter by billing status"
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={clearFilters}
          className="text-sm text-zinc-400 underline underline-offset-2 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
