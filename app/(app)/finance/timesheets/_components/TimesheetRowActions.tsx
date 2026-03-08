'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import {
  updateTimesheetEntryAction,
  deleteTimesheetEntryAction,
} from '@/lib/actions/finance/timesheet';

interface TimesheetRowProps {
  id: string;
  date: Date;
  description: string;
  timeSpentMinutes: number | null;
  rate: number;
  value: number;
  currency: string;
  isBilled: boolean;
  // Formatted display values (computed by the server)
  formattedDate: string;
  formattedRate: string;
  formattedValue: string;
}

type Mode = 'idle' | 'edit' | 'confirmDelete';

function inputCls(hasError: boolean): string {
  return [
    'block w-full rounded border px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500',
    'bg-white dark:bg-zinc-900 dark:text-zinc-50',
    hasError ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-700',
  ].join(' ');
}

export function TimesheetRow({
  id,
  date,
  description,
  timeSpentMinutes,
  rate,
  value,
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
      <tr className="bg-teal-50 dark:bg-teal-950/20">
        <td colSpan={7} className="px-4 py-3">
          <form onSubmit={handleEdit} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {error && (
              <p className="col-span-3 text-xs text-red-600 dark:text-red-400">{error}</p>
            )}
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Date
              </label>
              <input
                name="date"
                type="date"
                required
                defaultValue={defaultDate}
                className={inputCls(!!fieldErrors.date)}
              />
              {fieldErrors.date && (
                <p className="mt-0.5 text-xs text-red-600">{fieldErrors.date[0]}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Hours
              </label>
              <input
                name="hours"
                type="number"
                step="0.25"
                min="0.25"
                max="24"
                required
                defaultValue={defaultHours}
                className={inputCls(!!fieldErrors.hours)}
              />
              {fieldErrors.hours && (
                <p className="mt-0.5 text-xs text-red-600">{fieldErrors.hours[0]}</p>
              )}
            </div>
            <div className="sm:col-span-3">
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Description
              </label>
              <textarea
                name="description"
                rows={2}
                required
                defaultValue={description}
                className={inputCls(!!fieldErrors.description)}
              />
              {fieldErrors.description && (
                <p className="mt-0.5 text-xs text-red-600">{fieldErrors.description[0]}</p>
              )}
            </div>
            <div className="sm:col-span-3 flex items-center gap-2">
              <button
                type="submit"
                disabled={isPending}
                className="rounded bg-teal-600 px-3 py-1 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
              >
                {isPending ? 'Saving…' : 'Save changes'}
              </button>
              <button
                type="button"
                onClick={() => { setMode('idle'); setError(null); setFieldErrors({}); }}
                className="rounded px-3 py-1 text-xs text-zinc-600 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-700"
              >
                Cancel
              </button>
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
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="rounded bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {isPending ? 'Deleting…' : 'Delete'}
            </button>
            <button
              type="button"
              onClick={() => { setMode('idle'); setError(null); }}
              className="rounded px-3 py-1 text-xs text-zinc-600 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-700"
            >
              Cancel
            </button>
            {error && <p className="text-xs text-red-600">{error}</p>}
          </div>
        </td>
      </tr>
    );
  }

  // ─── Idle: normal row ──────────────────────────────────────────────────────

  const badgeCls = isBilled
    ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400';

  return (
    <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
      <td className="whitespace-nowrap px-4 py-2.5 text-sm text-zinc-500 dark:text-zinc-400">
        {formattedDate}
      </td>
      <td className="px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300">
        {description}
      </td>
      <td className="px-4 py-2.5 text-right text-sm text-zinc-700 dark:text-zinc-300">
        {hours.toFixed(2)}
      </td>
      <td className="hidden px-4 py-2.5 text-right text-sm text-zinc-500 dark:text-zinc-400 sm:table-cell">
        {rate > 0 ? formattedRate : '—'}
      </td>
      <td className="hidden px-4 py-2.5 text-right text-sm text-zinc-700 dark:text-zinc-300 sm:table-cell">
        {rate > 0 ? formattedValue : '—'}
      </td>
      <td className="px-4 py-2.5 text-right">
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${badgeCls}`}>
          {isBilled ? 'Billed' : 'Unbilled'}
        </span>
      </td>
      <td className="px-4 py-2.5 text-right">
        {!isBilled ? (
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setMode('edit')}
              className="text-xs text-zinc-500 hover:text-teal-600 dark:text-zinc-400 dark:hover:text-teal-400"
            >
              Edit
            </button>
            <span className="text-zinc-300 dark:text-zinc-600">|</span>
            <button
              type="button"
              onClick={() => setMode('confirmDelete')}
              className="text-xs text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400"
            >
              Delete
            </button>
          </div>
        ) : null}
      </td>
    </tr>
  );
}
