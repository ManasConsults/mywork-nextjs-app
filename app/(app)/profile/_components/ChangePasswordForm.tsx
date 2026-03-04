'use client';

import { useState, useTransition } from 'react';

import { changePasswordAction } from '@/lib/actions/user';

export function ChangePasswordForm(): React.JSX.Element {
  const [isPending, startTransition] = useTransition();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setSuccess(false);

    startTransition(async () => {
      const result = await changePasswordAction({
        currentPassword: current,
        newPassword: next,
        confirmPassword: confirm,
      });
      if (!result.success) {
        setError(result.error.message);
        if (result.error.fields) setFieldErrors(result.error.fields);
      } else {
        setSuccess(true);
        setCurrent('');
        setNext('');
        setConfirm('');
      }
    });
  }

  function fieldError(field: string): string | undefined {
    return fieldErrors[field]?.[0];
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && !Object.keys(fieldErrors).length && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-md bg-teal-50 px-4 py-3 text-sm text-teal-700 dark:bg-teal-900/20 dark:text-teal-400">
          Password changed successfully.
        </div>
      )}

      <div>
        <label htmlFor="currentPassword" className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Current password
        </label>
        <input
          id="currentPassword"
          type="password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          autoComplete="current-password"
          className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
        {fieldError('currentPassword') && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldError('currentPassword')}</p>
        )}
      </div>

      <div>
        <label htmlFor="newPassword" className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          New password
        </label>
        <input
          id="newPassword"
          type="password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          autoComplete="new-password"
          className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
        {fieldError('newPassword') && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldError('newPassword')}</p>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Confirm new password
        </label>
        <input
          id="confirmPassword"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
        {fieldError('confirmPassword') && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldError('confirmPassword')}</p>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {isPending ? 'Changing…' : 'Change password'}
        </button>
      </div>
    </form>
  );
}
