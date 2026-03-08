'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Account } from '@prisma/client';

import { createAccountAction, updateAccountAction } from '@/lib/actions/finance/account';
import { toMinorUnit } from '@/lib/utils/money';
import { useFinance } from '@/app/(app)/finance/_components/FinanceProvider';

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  CHECKING: 'Checking',
  SAVINGS: 'Savings',
  CASH: 'Cash',
  CREDIT: 'Credit',
  INVESTMENT: 'Investment',
};

const ACCOUNT_TYPES = ['CHECKING', 'SAVINGS', 'CASH', 'CREDIT', 'INVESTMENT'] as const;
type AccountType = (typeof ACCOUNT_TYPES)[number];

function isAccountType(value: string): value is AccountType {
  return (ACCOUNT_TYPES as readonly string[]).includes(value);
}

interface AccountFormProps {
  account?: Account;
}

interface FieldErrors {
  name?: string[];
  type?: string[];
  openingBalance?: string[];
  description?: string[];
  isDefault?: string[];
}

export function AccountForm({ account }: AccountFormProps): React.JSX.Element {
  const { currency } = useFinance();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rootError, setRootError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const isEdit = !!account;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const balanceRaw = fd.get('openingBalance') as string;
    const balanceDecimal = parseFloat(balanceRaw || '0');
    if (isNaN(balanceDecimal) || balanceDecimal < 0) {
      setFieldErrors({ openingBalance: ['Opening balance must be a non-negative number'] });
      return;
    }

    const typeRaw = fd.get('type') as string;
    if (!isAccountType(typeRaw)) {
      setFieldErrors({ type: ['Invalid account type selected'] });
      return;
    }

    const input = {
      name: (fd.get('name') as string).trim(),
      type: typeRaw,
      openingBalance: toMinorUnit(balanceDecimal),
      currency,
      description: (fd.get('description') as string).trim() || undefined,
      isDefault: fd.get('isDefault') === 'on',
      bankName: (fd.get('bankName') as string).trim() || undefined,
      accountNumber: (fd.get('accountNumber') as string).trim() || undefined,
      bsb: (fd.get('bsb') as string).trim() || undefined,
      iban: (fd.get('iban') as string).trim() || undefined,
      swiftBic: (fd.get('swiftBic') as string).trim() || undefined,
    };

    setFieldErrors({});
    setRootError(null);

    startTransition(async () => {
      const result = isEdit
        ? await updateAccountAction(account.id, input)
        : await createAccountAction(input);

      if (!result.success) {
        setRootError(result.error.message);
        if (result.error.fields) {
          setFieldErrors(result.error.fields as FieldErrors);
        }
        return;
      }
      router.push('/finance/accounts');
    });
  }

  const defaultBalance =
    account?.openingBalance != null ? (account.openingBalance / 100).toFixed(2) : '0.00';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {rootError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
          {rootError}
        </div>
      )}

      <Field label="Account name" error={fieldErrors.name?.[0]} required>
        <input
          name="name"
          type="text"
          defaultValue={account?.name ?? ''}
          placeholder="e.g. Main Current Account"
          required
          className={inputCls(!!fieldErrors.name)}
        />
      </Field>

      <Field label="Account type" error={fieldErrors.type?.[0]} required>
        <select
          name="type"
          defaultValue={account?.type ?? 'CHECKING'}
          className={inputCls(!!fieldErrors.type)}
        >
          {ACCOUNT_TYPES.map((t) => (
            <option key={t} value={t}>
              {ACCOUNT_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Opening balance" error={fieldErrors.openingBalance?.[0]}>
        <input
          name="openingBalance"
          type="number"
          step="0.01"
          min="0"
          defaultValue={defaultBalance}
          placeholder="0.00"
          className={inputCls(!!fieldErrors.openingBalance)}
        />
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Enter the starting balance as a decimal, e.g. 1250.00
        </p>
      </Field>

      <Field label="Description" error={fieldErrors.description?.[0]}>
        <textarea
          name="description"
          defaultValue={account?.description ?? ''}
          rows={3}
          placeholder="Optional description"
          className={inputCls(!!fieldErrors.description)}
        />
      </Field>

      {/* Payment / banking details — used on invoices */}
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/40">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Payment details (shown on invoices)
        </p>
        <div className="space-y-4">
          <Field label="Bank name">
            <input
              name="bankName"
              type="text"
              maxLength={100}
              defaultValue={account?.bankName ?? ''}
              placeholder="e.g. Commonwealth Bank"
              className={inputCls(false)}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="BSB">
              <input
                name="bsb"
                type="text"
                maxLength={20}
                defaultValue={account?.bsb ?? ''}
                placeholder="e.g. 062-000"
                className={inputCls(false)}
              />
            </Field>
            <Field label="Account number">
              <input
                name="accountNumber"
                type="text"
                maxLength={50}
                defaultValue={account?.accountNumber ?? ''}
                placeholder="e.g. 12345678"
                className={inputCls(false)}
              />
            </Field>
          </div>
          <Field label="IBAN">
            <input
              name="iban"
              type="text"
              maxLength={34}
              defaultValue={account?.iban ?? ''}
              placeholder="e.g. GB29NWBK60161331926819"
              className={inputCls(false)}
            />
          </Field>
          <Field label="SWIFT / BIC">
            <input
              name="swiftBic"
              type="text"
              maxLength={11}
              defaultValue={account?.swiftBic ?? ''}
              placeholder="e.g. BARCGB22"
              className={inputCls(false)}
            />
          </Field>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <input
          id="isDefault"
          name="isDefault"
          type="checkbox"
          defaultChecked={account?.isDefault ?? false}
          className="h-4 w-4 rounded border-zinc-300 text-teal-600 focus:ring-teal-500 dark:border-zinc-600 dark:bg-zinc-800"
        />
        <label
          htmlFor="isDefault"
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Set as default account
        </label>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 transition-colors disabled:opacity-50"
        >
          {isPending ? 'Saving…' : isEdit ? 'Save account' : 'Save account'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/finance/accounts')}
          className="rounded-lg px-4 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          Cancel
        </button>
      </div>
    </form>
  );
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
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

function inputCls(hasError: boolean): string {
  return [
    'block w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500',
    'bg-white dark:bg-zinc-900 dark:text-zinc-50',
    hasError
      ? 'border-red-500 dark:border-red-500'
      : 'border-zinc-300 dark:border-zinc-700',
  ].join(' ');
}
