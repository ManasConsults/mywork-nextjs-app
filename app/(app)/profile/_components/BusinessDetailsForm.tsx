'use client';

import { useState, useTransition } from 'react';

import { updateBusinessDetailsAction } from '@/lib/actions/user';

interface BusinessDetailsFormProps {
  initialBusinessName: string | null;
  initialAbn: string | null;
  initialBusinessEmail: string | null;
  initialBusinessPhone: string | null;
  initialBusinessAddress: string | null;
}

export function BusinessDetailsForm({
  initialBusinessName,
  initialAbn,
  initialBusinessEmail,
  initialBusinessPhone,
  initialBusinessAddress,
}: BusinessDetailsFormProps): React.JSX.Element {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fields, setFields] = useState({
    businessName: initialBusinessName ?? '',
    abn: initialAbn ?? '',
    businessEmail: initialBusinessEmail ?? '',
    businessPhone: initialBusinessPhone ?? '',
    businessAddress: initialBusinessAddress ?? '',
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setFields((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setSuccess(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await updateBusinessDetailsAction({
        businessName: fields.businessName || null,
        abn: fields.abn || null,
        businessEmail: fields.businessEmail || null,
        businessPhone: fields.businessPhone || null,
        businessAddress: fields.businessAddress || null,
      });

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
          Business details saved.
        </div>
      )}

      <Field label="Business / Trading Name">
        <input
          name="businessName"
          type="text"
          maxLength={200}
          value={fields.businessName}
          onChange={handleChange}
          placeholder="e.g. Acme Consulting"
          className={inputCls}
        />
      </Field>

      <Field label="ABN" hint="Australian Business Number — included on invoices">
        <input
          name="abn"
          type="text"
          maxLength={20}
          value={fields.abn}
          onChange={handleChange}
          placeholder="e.g. 12 345 678 901"
          className={inputCls}
        />
      </Field>

      <Field label="Business Email">
        <input
          name="businessEmail"
          type="email"
          maxLength={254}
          value={fields.businessEmail}
          onChange={handleChange}
          placeholder="billing@yourbusiness.com"
          className={inputCls}
        />
      </Field>

      <Field label="Phone / Contact">
        <input
          name="businessPhone"
          type="tel"
          maxLength={30}
          value={fields.businessPhone}
          onChange={handleChange}
          placeholder="+61 4xx xxx xxx"
          className={inputCls}
        />
      </Field>

      <Field label="Business Address">
        <textarea
          name="businessAddress"
          rows={3}
          maxLength={500}
          value={fields.businessAddress}
          onChange={handleChange}
          placeholder="Street, City, State, Postcode"
          className={inputCls}
        />
      </Field>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {isPending ? 'Saving…' : 'Save details'}
        </button>
      </div>
    </form>
  );
}

const inputCls =
  'block w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:placeholder-zinc-600';

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">{hint}</p>}
    </div>
  );
}
