'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import {
  updateTimesheetEntryAction,
  deleteTimesheetEntryAction,
} from '@/lib/actions/finance/timesheet';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface TimesheetRowProps {
  id: string;
  date: Date;
  description: string;
  timeSpentMinutes: number | null;
  rate: number;
  value: number;
  currency: string;
  isBilled: boolean;
  formattedDate: string;
  formattedRate: string;
  formattedValue: string;
}

type Mode = 'idle' | 'edit' | 'confirmDelete';

export function TimesheetRow({
  id,
  date,
  description,
  timeSpentMinutes,
  rate,
  isBilled,
  formattedDate,
  formattedRate,
  formattedValue,
}: TimesheetRowProps): React.JSX.Element {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('idle');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const defaultHours = ((timeSpentMinutes ?? 0) / 60).toFixed(2);
  const defaultDate = new Date(date).toISOString().split('T')[0];
  const hours = (timeSpentMinutes ?? 0) / 60;

  function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = await updateTimesheetEntryAction(id, {
        description: fd.get('description') as string,
        date: new Date(fd.get('date') as string),
        hours: parseFloat(fd.get('hours') as string),
      });

      if (!result.success) {
        if (result.error.fields) setFieldErrors(result.error.fields);
        setError(result.error.message);
        return;
      }

      setMode('idle');
      router.refresh();
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteTimesheetEntryAction(id);
      if (!result.success) {
        setError(result.error.message);
        setMode('idle');
        return;
      }
      router.refresh();
    });
  }

  if (mode === 'edit') {
    return (
      <tr className="bg-primary/5">
        <td colSpan={7} className="px-4 py-3">
          <form onSubmit={handleEdit} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {error && <p className="col-span-3 text-xs text-red-600 dark:text-red-400">{error}</p>}
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Date</Label>
              <Input name="date" type="date" required defaultValue={defaultDate} aria-invalid={!!fieldErrors.date} className="h-8 text-sm" />
              {fieldErrors.date && <p className="text-xs text-red-600">{fieldErrors.date[0]}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Hours</Label>
              <Input name="hours" type="number" step="0.25" min="0.25" max="24" required defaultValue={defaultHours} aria-invalid={!!fieldErrors.hours} className="h-8 text-sm" />
              {fieldErrors.hours && <p className="text-xs text-red-600">{fieldErrors.hours[0]}</p>}
            </div>
            <div className="flex flex-col gap-1 sm:col-span-3">
              <Label className="text-xs">Description</Label>
              <Textarea name="description" rows={2} required defaultValue={description} aria-invalid={!!fieldErrors.description} className="text-sm" />
              {fieldErrors.description && <p className="text-xs text-red-600">{fieldErrors.description[0]}</p>}
            </div>
            <div className="flex items-center gap-2 sm:col-span-3">
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending ? 'Saving…' : 'Save changes'}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => { setMode('idle'); setError(null); setFieldErrors({}); }}>
                Cancel
              </Button>
            </div>
          </form>
        </td>
      </tr>
    );
  }

  if (mode === 'confirmDelete') {
    return (
      <tr className="bg-red-50 dark:bg-red-950/20">
        <td colSpan={7} className="px-4 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-red-700 dark:text-red-400">
              Delete &ldquo;<span className="font-medium">{description}</span>&rdquo;? This cannot be undone.
            </p>
            <Button type="button" size="sm" variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? 'Deleting…' : 'Delete'}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => { setMode('idle'); setError(null); }}>
              Cancel
            </Button>
            {error && <p className="text-xs text-red-600">{error}</p>}
          </div>
        </td>
      </tr>
    );
  }

  const badgeCls = isBilled
    ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400';

  return (
    <tr className="hover:bg-accent/40/40">
      <td className="whitespace-nowrap px-4 py-2.5 text-sm text-muted-foreground">{formattedDate}</td>
      <td className="px-4 py-2.5 text-sm text-foreground">{description}</td>
      <td className="px-4 py-2.5 text-right text-sm text-foreground">{hours.toFixed(2)}</td>
      <td className="hidden px-4 py-2.5 text-right text-sm text-muted-foreground sm:table-cell">
        {rate > 0 ? formattedRate : '—'}
      </td>
      <td className="hidden px-4 py-2.5 text-right text-sm text-foreground sm:table-cell">
        {rate > 0 ? formattedValue : '—'}
      </td>
      <td className="px-4 py-2.5 text-right">
        <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold', badgeCls)}>
          {isBilled ? 'Billed' : 'Unbilled'}
        </span>
      </td>
      <td className="px-4 py-2.5 text-right">
        {!isBilled && (
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setMode('edit')} className="h-auto px-2 py-0.5 text-xs text-muted-foreground hover:text-primary">
              Edit
            </Button>
            <span className="text-foreground">|</span>
            <Button type="button" variant="ghost" size="sm" onClick={() => setMode('confirmDelete')} className="h-auto px-2 py-0.5 text-xs text-muted-foreground hover:text-destructive">
              Delete
            </Button>
          </div>
        )}
      </td>
    </tr>
  );
}
