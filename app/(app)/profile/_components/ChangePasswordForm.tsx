'use client';

import { useState, useTransition } from 'react';

import { changePasswordAction } from '@/lib/actions/user';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function ChangePasswordForm(): React.JSX.Element {
  const [isPending, startTransition] = useTransition();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
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
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-md border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary">
          Password changed successfully.
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="currentPassword">Current password</Label>
        <Input
          id="currentPassword"
          type="password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          autoComplete="current-password"
          disabled={isPending}
          aria-invalid={!!fieldError('currentPassword')}
        />
        {fieldError('currentPassword') && (
          <p className="text-xs text-red-600 dark:text-red-400">{fieldError('currentPassword')}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="newPassword">New password</Label>
        <Input
          id="newPassword"
          type="password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          autoComplete="new-password"
          disabled={isPending}
          aria-invalid={!!fieldError('newPassword')}
        />
        {fieldError('newPassword') && (
          <p className="text-xs text-red-600 dark:text-red-400">{fieldError('newPassword')}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword">Confirm new password</Label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          disabled={isPending}
          aria-invalid={!!fieldError('confirmPassword')}
        />
        {fieldError('confirmPassword') && (
          <p className="text-xs text-red-600 dark:text-red-400">{fieldError('confirmPassword')}</p>
        )}
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Changing…' : 'Change password'}
        </Button>
      </div>
    </form>
  );
}
