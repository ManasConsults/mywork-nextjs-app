'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Budget, Category } from '@prisma/client';

import { createBudgetAction, updateBudgetAction } from '@/lib/actions/finance/budget';
import { createBudgetSchema, updateBudgetSchema } from '@/lib/schemas/finance/budget.schema';
import { toMinorUnit } from '@/lib/utils/money';

const PERIOD_LABELS: Record<'MONTHLY' | 'ANNUAL', string> = {
  MONTHLY: 'Monthly',
  ANNUAL: 'Annual',
};

interface FieldErrors {
  categoryId?: string[];
  amount?: string[];
  period?: string[];
  startDate?: string[];
  endDate?: string[];
}

interface BudgetFormProps {
  categories: Category[];
  budget?: Budget;
  onClose?: () => void;
}

function inputCls(hasError: boolean): string {
  return [
    'block w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500',
    'bg-white dark:bg-zinc-800 dark:text-zinc-50',
    hasError
      ? 'border-red-500 dark:border-red-500'
      : 'border-zinc-300 dark:border-zinc-700',
  ].join(' ');
}

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}

function toDateInputValue(date: Date): string {
  return date.toISOString().split('T')[0] ?? '';
}

export function BudgetForm({
  categories,
  budget,
  onClose,
}: BudgetFormProps): React.JSX.Element {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rootError, setRootError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const isEdit = !!budget;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const amountDecimal = parseFloat(fd.get('amount') as string);
    const amountMinor = Number.isFinite(amountDecimal) ? toMinorUnit(amountDecimal) : 0;

    const startDateRaw = fd.get('startDate') as string;
    const endDateRaw = (fd.get('endDate') as string).trim();

    const raw = {
      categoryId: fd.get('categoryId') as string,
      amount: amountMinor,
      period: fd.get('period') as string,
      startDate: startDateRaw,
      endDate: endDateRaw || undefined,
    };

    if (isEdit) {
      const parsed = updateBudgetSchema.safeParse(raw);
      if (!parsed.success) {
        setFieldErrors(parsed.error.flatten().fieldErrors as FieldErrors);
        return;
      }
      setFieldErrors({});
      setRootError(null);

      startTransition(async () => {
        const result = await updateBudgetAction(budget.id, parsed.data);
        if (!result.success) {
          setRootError(result.error.message);
          if (result.error.fields) {
            setFieldErrors(result.error.fields as FieldErrors);
          }
          return;
        }
        if (onClose) {
          router.refresh();
          onClose();
        } else {
          router.push('/finance/budgets');
          router.refresh();
        }
      });
    } else {
      const parsed = createBudgetSchema.safeParse(raw);
      if (!parsed.success) {
        setFieldErrors(parsed.error.flatten().fieldErrors as FieldErrors);
        return;
      }
      setFieldErrors({});
      setRootError(null);

      startTransition(async () => {
        const result = await createBudgetAction(parsed.data);
        if (!result.success) {
          setRootError(result.error.message);
          if (result.error.fields) {
            setFieldErrors(result.error.fields as FieldErrors);
          }
          return;
        }
        if (onClose) {
          router.refresh();
          onClose();
        } else {
          router.push('/finance/budgets');
          router.refresh();
        }
      });
    }
  }

  const defaultStartDate = budget?.startDate
    ? toDateInputValue(new Date(budget.startDate))
    : toDateInputValue(new Date());

  const defaultEndDate = budget?.endDate
    ? toDateInputValue(new Date(budget.endDate))
    : '';

  // Display amount in decimal form (minor units / 100)
  const defaultAmountDisplay =
    budget?.amount !== undefined ? (budget.amount / 100).toFixed(2) : '';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {rootError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {rootError}
        </div>
      )}

      <Field label="Category" error={fieldErrors.categoryId?.[0]} required>
        <select
          name="categoryId"
          defaultValue={budget?.categoryId ?? ''}
          className={inputCls(!!fieldErrors.categoryId)}
        >
          <option value="" disabled>
            Select a category…
          </option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Amount" error={fieldErrors.amount?.[0]} required>
        <input
          name="amount"
          type="number"
          min="0.01"
          step="0.01"
          defaultValue={defaultAmountDisplay}
          placeholder="e.g. 200.00"
          required
          className={inputCls(!!fieldErrors.amount)}
        />
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Enter the budget limit in pounds (e.g. 200.00).
        </p>
      </Field>

      <Field label="Period" error={fieldErrors.period?.[0]} required>
        <select
          name="period"
          defaultValue={budget?.period ?? 'MONTHLY'}
          className={inputCls(!!fieldErrors.period)}
        >
          {(['MONTHLY', 'ANNUAL'] as const).map((p) => (
            <option key={p} value={p}>
              {PERIOD_LABELS[p]}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Start Date" error={fieldErrors.startDate?.[0]} required>
        <input
          name="startDate"
          type="date"
          defaultValue={defaultStartDate}
          required
          className={inputCls(!!fieldErrors.startDate)}
        />
      </Field>

      <Field label="End Date (optional)" error={fieldErrors.endDate?.[0]}>
        <input
          name="endDate"
          type="date"
          defaultValue={defaultEndDate}
          className={inputCls(!!fieldErrors.endDate)}
        />
      </Field>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:opacity-50"
        >
          {isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Create budget'}
        </button>
        <button
          type="button"
          onClick={() => {
            if (onClose) {
              onClose();
            } else {
              router.push('/finance/budgets');
            }
          }}
          className="rounded-lg px-4 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
