'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Client } from '@prisma/client';

import { createClientAction, updateClientAction } from '@/lib/actions/finance/client';
import { toMinorUnit } from '@/lib/utils/money';

interface ClientFormProps {
  client?: Client;
}

interface FieldErrors {
  name?: string[];
  email?: string[];
  phone?: string[];
  address?: string[];
  defaultRate?: string[];
  notes?: string[];
}

export function ClientForm({ client }: ClientFormProps): React.JSX.Element {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rootError, setRootError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const isEdit = !!client;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const rateRaw = fd.get('defaultRate') as string;
    let defaultRate: number | undefined;
    if (rateRaw && rateRaw.trim() !== '') {
      const rateDecimal = parseFloat(rateRaw);
      if (isNaN(rateDecimal) || rateDecimal <= 0) {
        setFieldErrors({ defaultRate: ['Default rate must be a positive number'] });
        return;
      }
      defaultRate = toMinorUnit(rateDecimal);
    }

    const input = {
      name: (fd.get('name') as string).trim(),
      email: (fd.get('email') as string).trim() || undefined,
      phone: (fd.get('phone') as string).trim() || undefined,
      address: (fd.get('address') as string).trim() || undefined,
      defaultRate,
      notes: (fd.get('notes') as string).trim() || undefined,
    };

    setFieldErrors({});
    setRootError(null);

    startTransition(async () => {
      const result = isEdit
        ? await updateClientAction(client.id, input)
        : await createClientAction(input);

      if (!result.success) {
        setRootError(result.error.message);
        if (result.error.fields) {
          setFieldErrors(result.error.fields as FieldErrors);
        }
        return;
      }

      if (isEdit) {
        router.refresh();
      } else {
        router.push('/finance/clients');
      }
    });
  }

  const defaultRateDisplay =
    client?.defaultRate != null ? (client.defaultRate / 100).toFixed(2) : '';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {rootError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
          {rootError}
        </div>
      )}

      <Field label="Name" error={fieldErrors.name?.[0]} required>
        <input
          name="name"
          type="text"
          defaultValue={client?.name ?? ''}
          placeholder="e.g. Acme Corp"
          required
          className={inputCls(!!fieldErrors.name)}
        />
      </Field>

      <Field label="Email" error={fieldErrors.email?.[0]}>
        <input
          name="email"
          type="email"
          defaultValue={client?.email ?? ''}
          placeholder="e.g. billing@acme.com"
          className={inputCls(!!fieldErrors.email)}
        />
      </Field>

      <Field label="Phone" error={fieldErrors.phone?.[0]}>
        <input
          name="phone"
          type="tel"
          defaultValue={client?.phone ?? ''}
          placeholder="e.g. +44 7700 900000"
          className={inputCls(!!fieldErrors.phone)}
        />
      </Field>

      <Field label="Address" error={fieldErrors.address?.[0]}>
        <textarea
          name="address"
          defaultValue={client?.address ?? ''}
          rows={3}
          placeholder="Billing address (optional)"
          className={inputCls(!!fieldErrors.address)}
        />
      </Field>

      <Field label="Default Hourly Rate" error={fieldErrors.defaultRate?.[0]}>
        <input
          name="defaultRate"
          type="number"
          step="0.01"
          min="0.01"
          defaultValue={defaultRateDisplay}
          placeholder="e.g. 75.00"
          className={inputCls(!!fieldErrors.defaultRate)}
        />
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Enter the hourly rate as a decimal, e.g. 75.00
        </p>
      </Field>

      <Field label="Notes" error={fieldErrors.notes?.[0]}>
        <textarea
          name="notes"
          defaultValue={client?.notes ?? ''}
          rows={4}
          placeholder="Internal notes about this client (optional)"
          className={inputCls(!!fieldErrors.notes)}
        />
      </Field>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 transition-colors disabled:opacity-50"
        >
          {isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Create client'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/finance/clients')}
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
