'use client';

import { useRouter, useSearchParams } from 'next/navigation';

const TRANSACTION_TYPES = [
  { value: 'INCOME', label: 'Income' },
  { value: 'EXPENSE', label: 'Expense' },
  { value: 'TRANSFER_OUT', label: 'Transfer Out' },
  { value: 'TRANSFER_IN', label: 'Transfer In' },
] as const;

interface AccountOption {
  id: string;
  name: string;
}

interface CategoryOption {
  id: string;
  name: string;
  type: string;
}

interface TransactionFiltersProps {
  accounts: AccountOption[];
  categories: CategoryOption[];
  currentAccountId?: string;
  currentCategoryId?: string;
  currentType?: string;
  currentFrom?: string;
  currentTo?: string;
}

const selectCls =
  'rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300';

export function TransactionFilters({
  accounts,
  categories,
  currentAccountId,
  currentCategoryId,
  currentType,
  currentFrom,
  currentTo,
}: TransactionFiltersProps): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateFilter(key: string, value: string): void {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/finance/transactions?${params.toString()}`);
  }

  function clearFilters(): void {
    router.push('/finance/transactions');
  }

  const hasActiveFilters =
    !!currentAccountId ||
    !!currentCategoryId ||
    !!currentType ||
    !!currentFrom ||
    !!currentTo;

  return (
    <div className="mb-5 flex flex-wrap items-center gap-3">
      {/* Account filter */}
      <select
        value={currentAccountId ?? ''}
        onChange={(e) => updateFilter('accountId', e.target.value)}
        className={selectCls}
        aria-label="Filter by account"
      >
        <option value="">All accounts</option>
        {accounts.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </select>

      {/* Category filter */}
      <select
        value={currentCategoryId ?? ''}
        onChange={(e) => updateFilter('categoryId', e.target.value)}
        className={selectCls}
        aria-label="Filter by category"
      >
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      {/* Type filter */}
      <select
        value={currentType ?? ''}
        onChange={(e) => updateFilter('type', e.target.value)}
        className={selectCls}
        aria-label="Filter by type"
      >
        <option value="">All types</option>
        {TRANSACTION_TYPES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>

      {/* Date range */}
      <div className="flex items-center gap-2">
        <label className="text-sm text-zinc-500 dark:text-zinc-400">From</label>
        <input
          type="date"
          value={currentFrom ?? ''}
          onChange={(e) => updateFilter('from', e.target.value)}
          className={selectCls}
          aria-label="From date"
        />
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm text-zinc-500 dark:text-zinc-400">To</label>
        <input
          type="date"
          value={currentTo ?? ''}
          onChange={(e) => updateFilter('to', e.target.value)}
          className={selectCls}
          aria-label="To date"
        />
      </div>

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
