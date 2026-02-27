'use client';

import { useState, useTransition } from 'react';

import { updateSettingsAction } from '@/lib/actions/user';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface SettingsFormProps {
  initialFiscalYearStartMonth: number;
}

export function SettingsForm({ initialFiscalYearStartMonth }: SettingsFormProps): React.JSX.Element {
  const [isPending, startTransition] = useTransition();
  const [month, setMonth] = useState(initialFiscalYearStartMonth);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await updateSettingsAction({ fiscalYearStartMonth: month });
      if (!result.success) {
        setError(result.error.message);
      } else {
        setSuccess(true);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-md bg-teal-50 px-4 py-3 text-sm text-teal-700 dark:bg-teal-900/20 dark:text-teal-400">
          Settings saved.
        </div>
      )}

      <div>
        <label htmlFor="fiscalMonth" className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Fiscal year start month
        </label>
        <select
          id="fiscalMonth"
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
        >
          {MONTHS.map((label, i) => (
            <option key={i + 1} value={i + 1}>
              {label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
          Used for calculating fiscal-year reporting periods.
        </p>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {isPending ? 'Saving…' : 'Save settings'}
        </button>
      </div>
    </form>
  );
}
