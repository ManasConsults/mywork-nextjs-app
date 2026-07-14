'use client';

import Link from 'next/link';
import { Mail } from 'lucide-react';
import { useState, useTransition } from 'react';

import { forgotPasswordSchema } from '@/lib/schemas/auth.schema';
import { requestPasswordReset } from '@/lib/actions/auth';
import type { ForgotPasswordInput } from '@/lib/schemas/auth.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type FieldErrors = Partial<Record<keyof ForgotPasswordInput, string>>;

export function ForgotPasswordForm(): React.JSX.Element {
  const [email, setEmail] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [rootError, setRootError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isSuccess, setIsSuccess] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>): void {
    setEmail(e.target.value);
    if (fieldErrors.email) {
      setFieldErrors((prev) => ({ ...prev, email: undefined }));
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    setRootError(null);

    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setFieldErrors({ email: flat.email?.[0] });
      return;
    }

    startTransition(async () => {
      const result = await requestPasswordReset(parsed.data);

      if (!result.success) {
        if (result.error.fields) {
          const mapped: FieldErrors = {};
          for (const [key, msgs] of Object.entries(result.error.fields)) {
            mapped[key as keyof ForgotPasswordInput] = msgs[0];
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

  if (isSuccess) {
    return (
      <div role="status" className="py-4 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/5">
          <Mail className="size-6 text-primary" aria-hidden="true" />
        </div>
        <h3 className="mb-1 text-lg font-semibold text-foreground">Check your email</h3>
        <p className="text-sm text-muted-foreground">
          If an account exists for that email address, we&apos;ve sent a link to reset your password.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm font-medium text-primary hover:text-primary hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-1 text-xl font-semibold text-foreground">Forgot your password?</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        Enter your email address and we&apos;ll send you a link to reset it.
      </p>

      {rootError && (
        <div
          role="alert"
          aria-live="assertive"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
        >
          {rootError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={handleChange}
            disabled={isPending}
            aria-invalid={!!fieldErrors.email}
            aria-describedby={fieldErrors.email ? 'email-error' : undefined}
            placeholder="you@example.com"
          />
          {fieldErrors.email && (
            <p id="email-error" role="alert" className="text-xs text-red-600 dark:text-red-400">
              {fieldErrors.email}
            </p>
          )}
        </div>

        <Button type="submit" disabled={isPending} aria-busy={isPending} className="mt-6 w-full" size="lg">
          {isPending ? 'Sending…' : 'Send reset link'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Remembered your password?{' '}
        <Link href="/login" className="font-medium text-primary hover:text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
