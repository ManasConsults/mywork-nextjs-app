'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Settings } from 'lucide-react';

import { updateFiscalYearSettingAction } from '@/lib/actions/achievement';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

export function FiscalYearSettings({
  currentMonth,
}: {
  currentMonth: number;
}): React.JSX.Element {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  function handleChange(value: string) {
    startTransition(async () => {
      await updateFiscalYearSettingAction(Number(value));
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen((o) => !o)}
        title="Fiscal year settings"
        className="gap-1.5"
      >
        <Settings className="h-3.5 w-3.5" />
        FY settings
      </Button>

      {open && (
        <div className="absolute right-0 top-full z-10 mt-1 w-56 rounded-lg border border-border bg-card p-3 shadow-lg">
          <p className="mb-2 text-xs font-medium text-foreground">
            Fiscal year starts in
          </p>
          <Select value={String(currentMonth)} onValueChange={handleChange} disabled={isPending}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m) => (
                <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isPending && <p className="mt-1 text-xs text-muted-foreground">Saving…</p>}
        </div>
      )}
    </div>
  );
}
