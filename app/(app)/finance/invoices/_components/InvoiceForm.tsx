'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Client } from '@prisma/client';

import { createInvoiceAction } from '@/lib/actions/finance/invoice';

const TAX_RATES: { label: string; value: number }[] = [
  { label: '0%', value: 0 },
  { label: '5%', value: 500 },
  { label: '10%', value: 1000 },
  { label: '20%', value: 2000 },
];

interface PaymentAccount {
  id: string;
  name: string;
  bankName: string | null;
  accountNumber: string | null;
  bsb: string | null;
  iban: string | null;
  swiftBic: string | null;
}

interface InvoiceFormProps {
  clients: Client[];
  paymentAccounts: PaymentAccount[];
}

interface FieldErrors {
  clientId?: string[];
  paymentAccountId?: string[];
  issueDate?: string[];
  dueDate?: string[];
  taxRate?: string[];
  notes?: string[];
}

export function InvoiceForm({ clients, paymentAccounts }: InvoiceFormProps): React.JSX.Element {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rootError, setRootError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const clientId = (fd.get('clientId') as string).trim();
    const paymentAccountId = (fd.get('paymentAccountId') as string).trim() || undefined;
    const issueDateRaw = fd.get('issueDate') as string;
    const dueDateRaw = fd.get('dueDate') as string;
    const taxRateRaw = fd.get('taxRate') as string;
    const notes = (fd.get('notes') as string).trim() || undefined;

    const errors: FieldErrors = {};
    if (!clientId) errors.clientId = ['Please select a client'];
    if (!issueDateRaw) errors.issueDate = ['Issue date is required'];
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const input = {
      clientId,
      paymentAccountId,
      issueDate: new Date(issueDateRaw),
      dueDate: dueDateRaw ? new Date(dueDateRaw) : undefined,
      taxRate: parseInt(taxRateRaw, 10),
      notes,
    };

    setFieldErrors({});
    setRootError(null);

    startTransition(async () => {
      const result = await createInvoiceAction(input);

      if (!result.success) {
        setRootError(result.error.message);
        if (result.error.fields) {
          setFieldErrors(result.error.fields as FieldErrors);
        }
        return;
      }

      router.push(`/finance/invoices/${result.data.id}`);
    });
  }

  const today = new Date().toISOString().split('T')[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {rootError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
          {rootError}
        </div>
      )}

      <Field label="Client" error={fieldErrors.clientId?.[0]} required>
        <select name="clientId" defaultValue="" className={inputCls(!!fieldErrors.clientId)} required>
          <option value="" disabled>
            Select a client
          </option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Payment Account" error={fieldErrors.paymentAccountId?.[0]}>
        <select name="paymentAccountId" defaultValue="" className={inputCls(!!fieldErrors.paymentAccountId)}>
          <option value="">None (no payment details on invoice)</option>
          {paymentAccounts.map((a) => {
            const detail = [a.bankName, a.bsb, a.accountNumber, a.iban].filter(Boolean).join(' · ');
            return (
              <option key={a.id} value={a.id}>
                {a.name}{detail ? ` — ${detail}` : ''}
              </option>
            );
          })}
        </select>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Payment details will appear on the PDF so clients know where to pay
        </p>
      </Field>

      <Field label="Issue Date" error={fieldErrors.issueDate?.[0]} required>
        <input
          name="issueDate"
          type="date"
          defaultValue={today}
          required
          className={inputCls(!!fieldErrors.issueDate)}
        />
      </Field>

      <Field label="Due Date" error={fieldErrors.dueDate?.[0]}>
        <input
          name="dueDate"
          type="date"
          className={inputCls(!!fieldErrors.dueDate)}
        />
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Optional</p>
      </Field>

      <Field label="Tax Rate" error={fieldErrors.taxRate?.[0]}>
        <select name="taxRate" defaultValue="0" className={inputCls(!!fieldErrors.taxRate)}>
          {TAX_RATES.map((rate) => (
            <option key={rate.value} value={rate.value}>
              {rate.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Tax is applied to the subtotal when the invoice is sent
        </p>
      </Field>

      <Field label="Notes" error={fieldErrors.notes?.[0]}>
        <textarea
          name="notes"
          rows={4}
          placeholder="Optional notes for the client"
          maxLength={2000}
          className={inputCls(!!fieldErrors.notes)}
        />
      </Field>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending || clients.length === 0}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 transition-colors disabled:opacity-50"
        >
          {isPending ? 'Creating…' : 'Create Invoice'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/finance/invoices')}
          className="rounded-lg px-4 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          Cancel
        </button>
      </div>

      {clients.length === 0 && (
        <p className="text-sm text-amber-600 dark:text-amber-400">
          You need to{' '}
          <Link href="/finance/clients/new" className="underline">
            add a client
          </Link>{' '}
          before creating an invoice.
        </p>
      )}
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
