'use client';

import { useRouter, useSearchParams } from 'next/navigation';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

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
    !!currentAccountId || !!currentCategoryId || !!currentType || !!currentFrom || !!currentTo;

  return (
    <div className="mb-5 flex flex-wrap items-center gap-3">
      <Select value={currentAccountId ?? ''} onValueChange={(v) => updateFilter('accountId', v === '_all' ? '' : v)}>
        <SelectTrigger className="w-40" aria-label="Filter by account">
          <SelectValue placeholder="All accounts" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_all">All accounts</SelectItem>
          {accounts.map((a) => (
            <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={currentCategoryId ?? ''} onValueChange={(v) => updateFilter('categoryId', v === '_all' ? '' : v)}>
        <SelectTrigger className="w-40" aria-label="Filter by category">
          <SelectValue placeholder="All categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_all">All categories</SelectItem>
          {categories.map((c) => (
            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={currentType ?? ''} onValueChange={(v) => updateFilter('type', v === '_all' ? '' : v)}>
        <SelectTrigger className="w-36" aria-label="Filter by type">
          <SelectValue placeholder="All types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_all">All types</SelectItem>
          {TRANSACTION_TYPES.map((t) => (
            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">From</span>
        <Input type="date" value={currentFrom ?? ''} onChange={(e) => updateFilter('from', e.target.value)} className="w-36" aria-label="From date" />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">To</span>
        <Input type="date" value={currentTo ?? ''} onChange={(e) => updateFilter('to', e.target.value)} className="w-36" aria-label="To date" />
      </div>

      {hasActiveFilters && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="h-auto p-0 text-sm text-muted-foreground underline underline-offset-2"
        >
          Clear filters
        </Button>
      )}
    </div>
  );
}
