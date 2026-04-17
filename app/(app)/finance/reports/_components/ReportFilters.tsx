'use client';

import { useRouter, useSearchParams } from 'next/navigation';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type ReportType = 'pnl' | 'cashflow' | 'tax' | 'unbilled';

interface ReportFiltersProps {
  type: ReportType;
  currentFrom?: string;
  currentTo?: string;
  currentCategoryType?: string;
  currentMonths?: string;
  currentTaxYear?: string;
}

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

function buildTaxYearOptions(): { value: string; label: string }[] {
  const currentYear = new Date().getFullYear();
  const options: { value: string; label: string }[] = [];

  for (let i = 0; i < 3; i++) {
    const year = currentYear - i;
    options.push({
      value: `uk-${year}`,
      label: `${year}/${String(year + 1).slice(-2)} (UK Apr–Mar)`,
    });
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
      <div className="mb-5 flex gap-1 rounded-xl border border-border bg-muted/50 p-1/60">
        {tabs.map((tab) => (
          <Button
            key={tab.key}
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => switchTab(tab.key)}
            className={`flex-1 rounded-lg text-sm font-medium transition-colors ${
              type === tab.key
                ? 'bg-card text-primary shadow-sm hover:bg-card'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {type === 'pnl' && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">From</span>
            <Input type="date" value={currentFrom ?? ''} onChange={(e) => updateParam('from', e.target.value)} className="w-36" aria-label="P&L from date" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">To</span>
            <Input type="date" value={currentTo ?? ''} onChange={(e) => updateParam('to', e.target.value)} className="w-36" aria-label="P&L to date" />
          </div>
          <Select value={currentCategoryType ?? ''} onValueChange={(v) => updateParam('categoryType', v === '_all' ? '' : v)}>
            <SelectTrigger className="w-44" aria-label="Filter by category type">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_TYPES.map((ct) => (
                <SelectItem key={ct.value || '_all'} value={ct.value || '_all'}>{ct.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {type === 'cashflow' && (
        <div className="flex flex-wrap items-center gap-3">
          <Select value={currentMonths ?? '12'} onValueChange={(v) => updateParam('months', v)}>
            <SelectTrigger className="w-44" aria-label="Select number of months">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS_OPTIONS.map((m) => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {type === 'tax' && (
        <div className="flex flex-wrap items-center gap-3">
          <Select value={currentTaxYear ?? taxYearOptions[0]?.value ?? ''} onValueChange={(v) => updateParam('taxYear', v)}>
            <SelectTrigger className="w-52" aria-label="Select tax year">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {taxYearOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {type === 'unbilled' && (
        <p className="text-sm text-muted-foreground">
          Showing all unbilled billable work logs with no filters.
        </p>
      )}
    </div>
  );
}
