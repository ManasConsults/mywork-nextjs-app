'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Account, Category, Transaction } from '@prisma/client';

import { createTransactionAction, updateTransactionAction } from '@/lib/actions/finance/transaction';
import { createTransactionSchema, updateTransactionSchema } from '@/lib/schemas/finance/transaction.schema';
import { toMinorUnit } from '@/lib/utils/money';

// Inline relation type that mirrors what transaction.service returns
type TransactionWithRelations = Transaction & {
  account: { name: string };
  category: { name: string; type: string };
};

const TRANSACTION_TYPES = [
  { value: 'INCOME', label: 'Income' },
  { value: 'EXPENSE', label: 'Expense' },
  { value: 'TRANSFER_OUT', label: 'Transfer Out' },
  { value: 'TRANSFER_IN', label: 'Transfer In' },
] as const;

type TxType = (typeof TRANSACTION_TYPES)[number]['value'];

const WORK_CONTEXT_OPTIONS = [
  { value: 'EMPLOYED', label: 'Day Job' },
  { value: 'SOLE_TRADER', label: 'Sole Trading' },
] as const;

interface FieldErrors {
  type?: string[];
  accountId?: string[];
  amount?: string[];
  date?: string[];
  categoryId?: string[];
  description?: string[];
  reference?: string[];
  workContext?: string[];
  transferToAccountId?: string[];
}

interface TransactionFormProps {
  transaction?: TransactionWithRelations;
  accounts: Account[];
  categories: Category[];
  employmentType: string;
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

function todayIso(): string {
  return new Date().toISOString().split('T')[0];
}

export function TransactionForm({
  transaction,
  accounts,
  categories,
  employmentType,
}: TransactionFormProps): React.JSX.Element {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rootError, setRootError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const isEdit = !!transaction;
  const showWorkContext = employmentType === 'BOTH';

  const [selectedType, setSelectedType] = useState<TxType>(
    (transaction?.type as TxType) ?? 'EXPENSE',
  );

  const showTransferDest = selectedType === 'TRANSFER_OUT';

  const defaultDate = transaction?.date
    ? new Date(transaction.date).toISOString().split('T')[0]
    : todayIso();

  const defaultAmountDecimal =
    transaction?.amount != null
      ? (transaction.amount / 100).toFixed(2)
      : '';

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const amountRaw = fd.get('amount') as string;
    const amountDecimal = parseFloat(amountRaw);

    if (isNaN(amountDecimal) || amountDecimal <= 0) {
      setFieldErrors({ amount: ['Amount must be a positive number, e.g. 12.50'] });
      return;
    }

    const transferToAccountId =
      selectedType === 'TRANSFER_OUT'
        ? ((fd.get('transferToAccountId') as string) || undefined)
        : undefined;

    const workContextRaw = (fd.get('workContext') as string) || undefined;

    const raw = {
      type: selectedType,
      accountId: fd.get('accountId') as string,
      categoryId: fd.get('categoryId') as string,
      amount: toMinorUnit(amountDecimal),
      date: fd.get('date') as string,
      description: (fd.get('description') as string).trim() || undefined,
      reference: (fd.get('reference') as string).trim() || undefined,
      workContext:
        showWorkContext && workContextRaw
          ? (workContextRaw as 'EMPLOYED' | 'SOLE_TRADER')
          : undefined,
      transferToAccountId,
    };

    if (isEdit) {
      const parsed = updateTransactionSchema.safeParse(raw);
      if (!parsed.success) {
        setFieldErrors(parsed.error.flatten().fieldErrors as FieldErrors);
        return;
      }
      setFieldErrors({});
      setRootError(null);

      startTransition(async () => {
        const result = await updateTransactionAction(transaction.id, parsed.data);
        if (!result.success) {
          setRootError(result.error.message);
          if (result.error.fields) {
            setFieldErrors(result.error.fields as FieldErrors);
          }
          return;
        }
        router.push('/finance/transactions');
      });
    } else {
      const parsed = createTransactionSchema.safeParse(raw);
      if (!parsed.success) {
        setFieldErrors(parsed.error.flatten().fieldErrors as FieldErrors);
        return;
      }
      setFieldErrors({});
      setRootError(null);

      startTransition(async () => {
        const result = await createTransactionAction(parsed.data);
        if (!result.success) {
          setRootError(result.error.message);
          if (result.error.fields) {
            setFieldErrors(result.error.fields as FieldErrors);
          }
          return;
        }
        router.push('/finance/transactions');
      });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {rootError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
          {rootError}
        </div>
      )}

      {/* Type */}
      <Field label="Type" error={fieldErrors.type?.[0]} required>
        <select
          name="type"
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value as TxType)}
          className={inputCls(!!fieldErrors.type)}
        >
          {TRANSACTION_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </Field>

      {/* Account */}
      <Field label="Account" error={fieldErrors.accountId?.[0]} required>
        <select
          name="accountId"
          defaultValue={transaction?.accountId ?? ''}
          className={inputCls(!!fieldErrors.accountId)}
        >
          <option value="" disabled>
            Select an account…
          </option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </Field>

      {/* Transfer destination — only shown for TRANSFER_OUT */}
      {showTransferDest && (
        <Field
          label="Transfer to account"
          error={fieldErrors.transferToAccountId?.[0]}
          required
        >
          <select
            name="transferToAccountId"
            defaultValue=""
            className={inputCls(!!fieldErrors.transferToAccountId)}
          >
            <option value="" disabled>
              Select destination account…
            </option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </Field>
      )}

      {/* Amount */}
      <Field label="Amount" error={fieldErrors.amount?.[0]} required>
        <input
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          defaultValue={defaultAmountDecimal}
          placeholder="0.00"
          className={inputCls(!!fieldErrors.amount)}
        />
      </Field>

      {/* Date */}
      <Field label="Date" error={fieldErrors.date?.[0]} required>
        <input
          name="date"
          type="date"
          defaultValue={defaultDate}
          className={inputCls(!!fieldErrors.date)}
        />
      </Field>

      {/* Category */}
      <Field label="Category" error={fieldErrors.categoryId?.[0]} required>
        <select
          name="categoryId"
          defaultValue={transaction?.categoryId ?? ''}
          className={inputCls(!!fieldErrors.categoryId)}
        >
          <option value="" disabled>
            Select a category…
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>

      {/* Description */}
      <Field label="Description (optional)" error={fieldErrors.description?.[0]}>
        <input
          name="description"
          type="text"
          defaultValue={transaction?.description ?? ''}
          placeholder="e.g. Weekly groceries"
          maxLength={500}
          className={inputCls(!!fieldErrors.description)}
        />
      </Field>

      {/* Reference */}
      <Field label="Reference (optional)" error={fieldErrors.reference?.[0]}>
        <input
          name="reference"
          type="text"
          defaultValue={transaction?.reference ?? ''}
          placeholder="e.g. INV-0042"
          maxLength={100}
          className={inputCls(!!fieldErrors.reference)}
        />
      </Field>

      {/* Work context — only for BOTH employment type */}
      {showWorkContext && (
        <Field label="Work context (optional)" error={fieldErrors.workContext?.[0]}>
          <select
            name="workContext"
            defaultValue={transaction?.workContext ?? ''}
            className={inputCls(!!fieldErrors.workContext)}
          >
            <option value="">Not specified</option>
            {WORK_CONTEXT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 transition-colors disabled:opacity-50"
        >
          {isPending
            ? 'Saving…'
            : isEdit
              ? 'Save changes'
              : 'Create transaction'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/finance/transactions')}
          className="rounded-lg px-4 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
