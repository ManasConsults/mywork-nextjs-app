'use client';

import { useState, useTransition } from 'react';
import { useSession } from 'next-auth/react';

import { updateSettingsAction } from '@/lib/actions/user';
import { SUPPORTED_CURRENCIES } from '@/lib/schemas/profile.schema';
import type { SupportedCurrency } from '@/lib/schemas/profile.schema';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const CURRENCY_LABELS: Record<SupportedCurrency, string> = {
  GBP: 'GBP — British Pound (£)',
  USD: 'USD — US Dollar ($)',
  EUR: 'EUR — Euro (€)',
  CAD: 'CAD — Canadian Dollar ($)',
  AUD: 'AUD — Australian Dollar ($)',
  NZD: 'NZD — New Zealand Dollar ($)',
  CHF: 'CHF — Swiss Franc (Fr)',
  JPY: 'JPY — Japanese Yen (¥)',
  SEK: 'SEK — Swedish Krona (kr)',
  NOK: 'NOK — Norwegian Krone (kr)',
  DKK: 'DKK — Danish Krone (kr)',
  SGD: 'SGD — Singapore Dollar ($)',
  HKD: 'HKD — Hong Kong Dollar ($)',
  INR: 'INR — Indian Rupee (₹)',
};

interface SettingsFormProps {
  initialFiscalYearStartMonth: number;
  initialCurrency: string;
}

export function SettingsForm({ initialFiscalYearStartMonth, initialCurrency }: SettingsFormProps): React.JSX.Element {
  const { update } = useSession();
  const [isPending, startTransition] = useTransition();
  const [month, setMonth] = useState(initialFiscalYearStartMonth);
  const [currency, setCurrency] = useState(initialCurrency);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await updateSettingsAction({
        fiscalYearStartMonth: month,
        currency: currency as SupportedCurrency,
      });
      if (!result.success) {
        setError(result.error.message);
      } else {
        // Refresh the JWT so session.user.currency reflects the new value immediately.
        await update();
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

      <div>
        <label htmlFor="currency" className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Default currency
        </label>
        <select
          id="currency"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
        >
          {SUPPORTED_CURRENCIES.map((code) => (
            <option key={code} value={code}>
              {CURRENCY_LABELS[code]}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
          Used as the default currency for new invoices and financial reports.
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
