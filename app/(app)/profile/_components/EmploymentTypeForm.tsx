'use client';

import { useState, useTransition } from 'react';

import { updateEmploymentTypeAction } from '@/lib/actions/user';

const EMPLOYMENT_OPTIONS = [
  { value: 'EMPLOYED', label: 'Employee', description: 'Day job / PAYE employment only' },
  { value: 'SOLE_TRADER', label: 'Sole Trader', description: 'Self-employed / freelance only' },
  { value: 'BOTH', label: 'Both', description: 'Employee and sole trader simultaneously' },
] as const;

type EmploymentTypeValue = 'EMPLOYED' | 'SOLE_TRADER' | 'BOTH';

export function EmploymentTypeForm({
  initialEmploymentType,
}: {
  initialEmploymentType: string;
}): React.JSX.Element {
  const [selected, setSelected] = useState<EmploymentTypeValue>(
    initialEmploymentType as EmploymentTypeValue,
  );
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const res = await updateEmploymentTypeAction({ employmentType: selected });
      if (res.success) {
        setMessage({ type: 'success', text: 'Employment type updated.' });
      } else {
        setMessage({ type: 'error', text: res.error.message });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        {EMPLOYMENT_OPTIONS.map(({ value, label, description }) => (
          <label
            key={value}
            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
              selected === value
                ? 'border-teal-500 bg-teal-50 dark:border-teal-600 dark:bg-teal-900/20'
                : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600'
            }`}
          >
            <input
              type="radio"
              name="employmentType"
              value={value}
              checked={selected === value}
              onChange={() => setSelected(value)}
              className="mt-0.5 accent-teal-600"
            />
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{label}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
            </div>
          </label>
        ))}
      </div>

      {message && (
        <p
          className={`text-sm ${
            message.type === 'success'
              ? 'text-teal-600 dark:text-teal-400'
              : 'text-red-600 dark:text-red-400'
          }`}
        >
          {message.text}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending || selected === (initialEmploymentType as EmploymentTypeValue)}
        className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? 'Saving…' : 'Save'}
      </button>
    </form>
  );
}
