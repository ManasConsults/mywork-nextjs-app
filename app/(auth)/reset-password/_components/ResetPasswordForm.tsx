'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import { useState, useTransition } from 'react';

import { resetPasswordSchema } from '@/lib/schemas/auth.schema';
import { resetPassword } from '@/lib/actions/auth';
import type { ResetPasswordInput } from '@/lib/schemas/auth.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type FieldErrors = Partial<Record<keyof ResetPasswordInput, string>>;

export function ResetPasswordForm(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [values, setValues] = useState({ password: '', confirmPassword: '' });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [rootError, setRootError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isSuccess, setIsSuccess] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name as keyof typeof values]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    setRootError(null);

    const parsed = resetPasswordSchema.safeParse({ token, ...values });
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setFieldErrors({ password: flat.password?.[0], confirmPassword: flat.confirmPassword?.[0] });
      return;
    }

    startTransition(async () => {
      const result = await resetPassword(parsed.data);

      if (!result.success) {
        if (result.error.fields) {
          const mapped: FieldErrors = {};
          for (const [key, msgs] of Object.entries(result.error.fields)) {
            mapped[key as keyof ResetPasswordInput] = msgs[0];
          }
          setFieldErrors(mapped);
        } else {
          setRootError(result.error.message);
        }
        return;
      }

      setIsSuccess(true);
    });
  }

  if (!token) {
    return (
      <div role="alert" className="py-4 text-center">
        <h3 className="mb-1 text-lg font-semibold text-foreground">Invalid reset link</h3>
        <p className="text-sm text-muted-foreground">
          This password reset link is missing or malformed. Please request a new one.
        </p>
        <Link
          href="/forgot-password"
          className="mt-6 inline-block text-sm font-medium text-primary hover:text-primary hover:underline"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div role="status" className="py-4 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/5">
          <CheckCircle className="size-6 text-primary" aria-hidden="true" />
        </div>
        <h3 className="mb-1 text-lg font-semibold text-foreground">Password reset</h3>
        <p className="mb-6 text-sm text-muted-foreground">
          Your password has been updated. You can now sign in with your new password.
        </p>
        <Button onClick={() => router.push('/login')} className="w-full" size="lg">
          Sign in
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold text-foreground">Choose a new password</h2>

      {rootError && (
        <div
          role="alert"
          aria-live="assertive"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
        >
          {rootError}
          {rootError.toLowerCase().includes('expired') || rootError.toLowerCase().includes('invalid') ? (
            <>
              {' '}
              <Link href="/forgot-password" className="underline">
                Request a new link
              </Link>
            </>
          ) : null}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={values.password}
              onChange={handleChange}
              disabled={isPending}
              aria-invalid={!!fieldErrors.password}
              aria-describedby={fieldErrors.password ? 'password-error' : undefined}
              placeholder="••••••••"
            />
            {fieldErrors.password && (
              <p id="password-error" role="alert" className="text-xs text-red-600 dark:text-red-400">
                {fieldErrors.password}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={values.confirmPassword}
              onChange={handleChange}
              disabled={isPending}
              aria-invalid={!!fieldErrors.confirmPassword}
              aria-describedby={fieldErrors.confirmPassword ? 'confirmPassword-error' : undefined}
              placeholder="••••••••"
            />
            {fieldErrors.confirmPassword && (
              <p id="confirmPassword-error" role="alert" className="text-xs text-red-600 dark:text-red-400">
                {fieldErrors.confirmPassword}
              </p>
            )}
          </div>
        </div>

        <Button type="submit" disabled={isPending} aria-busy={isPending} className="mt-6 w-full" size="lg">
          {isPending ? 'Resetting…' : 'Reset password'}
        </Button>
      </form>
    </div>
  );
}
