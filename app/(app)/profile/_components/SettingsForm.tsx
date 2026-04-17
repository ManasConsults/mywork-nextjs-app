'use client';

import { useState, useTransition } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

import { updateSettingsAction } from '@/lib/actions/user';
import { SUPPORTED_CURRENCIES } from '@/lib/schemas/profile.schema';
import type { SupportedCurrency } from '@/lib/schemas/profile.schema';
import { THEMES, THEME_COLORS } from '@/lib/theme';
import type { ThemeColor } from '@/lib/theme';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

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
  initialThemeColor: string;
}

export function SettingsForm({ initialFiscalYearStartMonth, initialCurrency, initialThemeColor }: SettingsFormProps): React.JSX.Element {
  const { update } = useSession();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [month, setMonth] = useState(String(initialFiscalYearStartMonth));
  const [currency, setCurrency] = useState(initialCurrency);
  const [themeColor, setThemeColor] = useState<ThemeColor>(
    THEME_COLORS.includes(initialThemeColor as ThemeColor) ? (initialThemeColor as ThemeColor) : 'teal',
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await updateSettingsAction({
        fiscalYearStartMonth: Number(month),
        currency: currency as SupportedCurrency,
        themeColor,
      });
      if (!result.success) {
        setError(result.error.message);
      } else {
        await update();
        // Hard-refresh so the server layout re-renders with the new theme CSS.
        router.refresh();
        setSuccess(true);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-md border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary">
          Settings saved.
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="fiscalMonth">Fiscal year start month</Label>
        <Select value={month} onValueChange={setMonth} disabled={isPending}>
          <SelectTrigger id="fiscalMonth" className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map((label, i) => (
              <SelectItem key={i + 1} value={String(i + 1)}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Used for calculating fiscal-year reporting periods.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="currency">Default currency</Label>
        <Select value={currency} onValueChange={setCurrency} disabled={isPending}>
          <SelectTrigger id="currency" className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SUPPORTED_CURRENCIES.map((code) => (
              <SelectItem key={code} value={code}>
                {CURRENCY_LABELS[code]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Used as the default currency for new invoices and financial reports.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label>Theme colour</Label>
        <div className="flex flex-wrap gap-2.5">
          {THEME_COLORS.map((key) => {
            const t = THEMES[key];
            const isSelected = themeColor === key;
            return (
              <button
                key={key}
                type="button"
                title={t.label}
                disabled={isPending}
                onClick={() => setThemeColor(key)}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full transition-all duration-150',
                  'ring-offset-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isSelected ? 'ring-2 ring-ring scale-110' : 'hover:scale-105',
                )}
                style={{ backgroundColor: t.swatch }}
                aria-pressed={isSelected}
                aria-label={t.label}
              >
                {isSelected && (
                  <svg className="size-4 text-white drop-shadow" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                    <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          Applies immediately after saving.
        </p>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : 'Save settings'}
        </Button>
      </div>
    </form>
  );
}
