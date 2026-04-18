'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { createTimesheetEntryAction } from '@/lib/actions/finance/timesheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ClientOption {
  id: string;
  name: string;
}

interface AddTimesheetEntryFormProps {
  clients: ClientOption[];
}

export function AddTimesheetEntryForm({ clients }: AddTimesheetEntryFormProps): React.JSX.Element {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [clientId, setClientId] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const hoursRaw = parseFloat(fd.get('hours') as string);

    setError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = await createTimesheetEntryAction({
        clientId,
        description: fd.get('description') as string,
        date: new Date(fd.get('date') as string),
        hours: hoursRaw,
      });

      if (!result.success) {
        if (result.error.fields) setFieldErrors(result.error.fields);
        setError(result.error.message);
        return;
      }

      (e.target as HTMLFormElement).reset();
      setClientId('');
      setOpen(false);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <Button type="button" onClick={() => setOpen(true)}>
        + New Entry
      </Button>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">New Timesheet Entry</h2>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => { setOpen(false); setError(null); setFieldErrors({}); }}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Cancel
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label>Client <span className="text-red-500">*</span></Label>
          <Select value={clientId} onValueChange={setClientId} disabled={isPending}>
            <SelectTrigger aria-invalid={!!fieldErrors.clientId}>
              <SelectValue placeholder="Select a client…" />
            </SelectTrigger>
            <SelectContent>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldErrors.clientId?.[0] && <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.clientId[0]}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="date">Date <span className="text-red-500">*</span></Label>
          <Input id="date" name="date" type="date" required defaultValue={todayStr} disabled={isPending} aria-invalid={!!fieldErrors.date} />
          {fieldErrors.date?.[0] && <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.date[0]}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="hours">Hours <span className="text-red-500">*</span></Label>
          <Input id="hours" name="hours" type="number" step="0.25" min="0.25" max="24" required placeholder="e.g. 2.5" disabled={isPending} aria-invalid={!!fieldErrors.hours} />
          {fieldErrors.hours?.[0] && <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.hours[0]}</p>}
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="description">Description <span className="text-red-500">*</span></Label>
          <Textarea id="description" name="description" rows={2} required placeholder="What did you work on?" disabled={isPending} aria-invalid={!!fieldErrors.description} />
          {fieldErrors.description?.[0] && <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.description[0]}</p>}
        </div>

        <div className="flex justify-end sm:col-span-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Saving…' : 'Save entry'}
          </Button>
        </div>
      </form>
    </div>
  );
}
