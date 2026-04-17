'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { addFromWorkLogsAction } from '@/lib/actions/finance/line-item';
import { toMinorUnit } from '@/lib/utils/money';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface WorkLogOption {
  id: string;
  date: Date;
  description: string;
  timeSpent: number | null;
}

interface AddFromWorkLogsFormProps {
  invoiceId: string;
  workLogs: WorkLogOption[];
  defaultRate: number | null;
}

export function AddFromWorkLogsForm({
  invoiceId,
  workLogs,
  defaultRate,
}: AddFromWorkLogsFormProps): React.JSX.Element {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [unitPriceStr, setUnitPriceStr] = useState(
    defaultRate != null ? (defaultRate / 100).toFixed(2) : '',
  );
  const [error, setError] = useState<string | null>(null);

  if (workLogs.length === 0) return <></>;

  function toggleAll(checked: boolean) {
    setSelected(checked ? new Set(workLogs.map((wl) => wl.id)) : new Set());
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSubmit() {
    if (selected.size === 0) { setError('Select at least one work log entry.'); return; }
    const unitPrice = parseFloat(unitPriceStr);
    if (isNaN(unitPrice) || unitPrice <= 0) { setError('Enter a valid unit price per hour.'); return; }
    setError(null);

    startTransition(async () => {
      const result = await addFromWorkLogsAction(invoiceId, Array.from(selected), toMinorUnit(unitPrice));
      if (!result.success) { setError(result.error.message); return; }
      setSelected(new Set());
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="mt-4">
      {!open ? (
        <Button type="button" variant="outline" onClick={() => setOpen(true)} className="border-primary/40 bg-primary/5 text-primary hover:bg-primary/10">
          + Add from Work Logs ({workLogs.length} unbilled)
        </Button>
      ) : (
        <div className="rounded-xl border border-border bg-muted/50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Select work log entries</h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => { setOpen(false); setError(null); }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
          </div>

          {error && (
            <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </p>
          )}

          <div className="mb-3 flex items-center gap-3">
            <Label className="text-sm font-medium">Rate / hr</Label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              value={unitPriceStr}
              onChange={(e) => setUnitPriceStr(e.target.value)}
              className="w-28 h-8 text-sm"
            />
          </div>

          <label className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={selected.size === workLogs.length}
              onChange={(e) => toggleAll(e.target.checked)}
              className="rounded"
            />
            Select all
          </label>

          <div className="max-h-64 overflow-y-auto divide-y divide-border/60 rounded-lg border border-border bg-card">
            {workLogs.map((wl) => {
              const hours = (wl.timeSpent ?? 0) / 60;
              return (
                <label
                  key={wl.id}
                  className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-accent/40/60"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(wl.id)}
                    onChange={() => toggle(wl.id)}
                    className="rounded"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-foreground">{wl.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(wl.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      {' · '}{hours.toFixed(2)} hrs
                    </p>
                  </div>
                </label>
              );
            })}
          </div>

          <div className="mt-3 flex items-center gap-3">
            <Button type="button" size="sm" onClick={handleSubmit} disabled={isPending || selected.size === 0}>
              {isPending ? 'Adding…' : `Add ${selected.size > 0 ? selected.size : ''} entry${selected.size === 1 ? '' : 's'}`}
            </Button>
            <span className="text-xs text-muted-foreground">
              {selected.size} of {workLogs.length} selected
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
