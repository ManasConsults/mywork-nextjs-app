'use client';

import { useRouter, useSearchParams } from 'next/navigation';

type ReportType = 'pnl' | 'cashflow' | 'tax' | 'unbilled';

interface ClientOption {
  id: string;
  name: string;
}

interface ReportFiltersProps {
  type: ReportType;
  currentFrom?: string;
  currentTo?: string;
  currentCategoryType?: string;
  currentMonths?: string;
  currentTaxYear?: string;
  clients?: ClientOption[];
}

const selectCls =
  'rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300';

const inputCls =
  'rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300';

const CATEGORY_TYPES = [
  { value: '', label: 'All categories' },
  { value: 'PERSONAL', label: 'Personal' },
  { value: 'WORK_RELATED', label: 'Work Related' },
  { value: 'BUSINESS', label: 'Business' },
] as const;

const MONTHS_OPTIONS = [
  { value: '3', label: 'Last 3 months' },
  { value: '6', label: 'Last 6 months' },
  { value: '12', label: 'Last 12 months' },
] as const;

/**
 * Build an array of tax year options.
 * UK: April 6 start; Calendar: January 1 start.
 * Returns the current year and the previous 2 years for each mode.
 */
function buildTaxYearOptions(): { value: string; label: string }[] {
  const currentYear = new Date().getFullYear();
  const options: { value: string; label: string }[] = [];

  for (let i = 0; i < 3; i++) {
    const year = currentYear - i;
    // UK tax year e.g. "2025-04-06" for 2025/26
    options.push({
      value: `uk-${year}`,
      label: `${year}/${String(year + 1).slice(-2)} (UK Apr–Mar)`,
    });
    // Calendar year e.g. "2025-01-01" for 2025
    options.push({
      value: `cal-${year}`,
      label: `${year} (Calendar Jan–Dec)`,
    });
  }

  return options;
}

export function ReportFilters({
  type,
  currentFrom,
  currentTo,
  currentCategoryType,
  currentMonths,
  currentTaxYear,
}: ReportFiltersProps): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string): void {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/finance/reports?${params.toString()}`);
  }

  function switchTab(newType: ReportType): void {
    router.push(`/finance/reports?type=${newType}`);
  }

  const tabs: { key: ReportType; label: string }[] = [
    { key: 'pnl', label: 'P&L' },
    { key: 'cashflow', label: 'Cash Flow' },
    { key: 'tax', label: 'Tax Summary' },
    { key: 'unbilled', label: 'Unbilled Hours' },
  ];

  const taxYearOptions = buildTaxYearOptions();

  return (
    <div className="mb-6">
      {/* Tab navigation */}
      <div className="mb-5 flex gap-1 rounded-xl border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-900/60">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => switchTab(tab.key)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              type === tab.key
                ? 'bg-white text-teal-700 shadow-sm dark:bg-zinc-800 dark:text-teal-400'
                : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Per-tab filter controls */}
      {type === 'pnl' && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-zinc-500 dark:text-zinc-400">From</label>
            <input
              type="date"
              value={currentFrom ?? ''}
              onChange={(e) => updateParam('from', e.target.value)}
              className={inputCls}
              aria-label="P&L from date"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-zinc-500 dark:text-zinc-400">To</label>
            <input
              type="date"
              value={currentTo ?? ''}
              onChange={(e) => updateParam('to', e.target.value)}
              className={inputCls}
              aria-label="P&L to date"
            />
          </div>
          <select
            value={currentCategoryType ?? ''}
            onChange={(e) => updateParam('categoryType', e.target.value)}
            className={selectCls}
            aria-label="Filter by category type"
          >
            {CATEGORY_TYPES.map((ct) => (
              <option key={ct.value} value={ct.value}>
                {ct.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {type === 'cashflow' && (
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={currentMonths ?? '12'}
            onChange={(e) => updateParam('months', e.target.value)}
            className={selectCls}
            aria-label="Select number of months"
          >
            {MONTHS_OPTIONS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {type === 'tax' && (
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={currentTaxYear ?? taxYearOptions[0]?.value ?? ''}
            onChange={(e) => updateParam('taxYear', e.target.value)}
            className={selectCls}
            aria-label="Select tax year"
          >
            {taxYearOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {type === 'unbilled' && (
        <p className="text-sm text-zinc-400 dark:text-zinc-500">
          Showing all unbilled billable work logs with no filters.
        </p>
      )}
    </div>
  );
}
