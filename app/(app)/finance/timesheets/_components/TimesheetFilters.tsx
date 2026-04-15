'use client';

import { useRouter, useSearchParams } from 'next/navigation';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

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
      <Select value={currentClientId ?? ''} onValueChange={(v) => updateParam('clientId', v === '_all' ? '' : v)}>
        <SelectTrigger className="w-40" aria-label="Filter by client">
          <SelectValue placeholder="All clients" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_all">All clients</SelectItem>
          {clients.map((c) => (
            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">From</span>
        <Input type="date" value={currentFrom ?? ''} onChange={(e) => updateParam('from', e.target.value)} className="w-36" aria-label="From date" />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">To</span>
        <Input type="date" value={currentTo ?? ''} onChange={(e) => updateParam('to', e.target.value)} className="w-36" aria-label="To date" />
      </div>

      <Select value={currentStatus ?? 'unbilled'} onValueChange={(v) => updateParam('status', v)}>
        <SelectTrigger className="w-36" aria-label="Filter by billing status">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button type="button" variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground hover:text-foreground">
          Clear filters
        </Button>
      )}
    </div>
  );
}
