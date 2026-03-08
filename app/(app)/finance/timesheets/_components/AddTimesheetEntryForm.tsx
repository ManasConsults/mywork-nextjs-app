'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { createTimesheetEntryAction } from '@/lib/actions/finance/timesheet';

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

  const todayStr = new Date().toISOString().split('T')[0];

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const hoursRaw = parseFloat(fd.get('hours') as string);

    setError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = await createTimesheetEntryAction({
        clientId: fd.get('clientId') as string,
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
      setOpen(false);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
      >
        + New Entry
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">New Timesheet Entry</h2>
        <button
          type="button"
          onClick={() => { setOpen(false); setError(null); setFieldErrors({}); }}
          className="text-xs text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          Cancel
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Client */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Client <span className="text-red-500">*</span>
          </label>
          <select
            name="clientId"
            required
            className={inputCls(!!fieldErrors.clientId)}
          >
            <option value="">Select a client…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {fieldErrors.clientId && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.clientId[0]}</p>
          )}
        </div>

        {/* Date */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Date <span className="text-red-500">*</span>
          </label>
          <input
            name="date"
            type="date"
            required
            defaultValue={todayStr}
            className={inputCls(!!fieldErrors.date)}
          />
          {fieldErrors.date && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.date[0]}</p>
          )}
        </div>

        {/* Hours */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Hours <span className="text-red-500">*</span>
          </label>
          <input
            name="hours"
            type="number"
            step="0.25"
            min="0.25"
            max="24"
            required
            placeholder="e.g. 2.5"
            className={inputCls(!!fieldErrors.hours)}
          />
          {fieldErrors.hours && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.hours[0]}</p>
          )}
        </div>

        {/* Description — full width */}
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            name="description"
            rows={2}
            required
            placeholder="What did you work on?"
            className={inputCls(!!fieldErrors.description)}
          />
          {fieldErrors.description && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.description[0]}</p>
          )}
        </div>

        <div className="sm:col-span-2 flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:opacity-50"
          >
            {isPending ? 'Saving…' : 'Save entry'}
          </button>
        </div>
      </form>
    </div>
  );
}

function inputCls(hasError: boolean): string {
  return [
    'block w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500',
    'bg-white dark:bg-zinc-900 dark:text-zinc-50',
    hasError ? 'border-red-500 dark:border-red-500' : 'border-zinc-300 dark:border-zinc-700',
  ].join(' ');
}
