'use client';

import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { useState, useTransition } from 'react';

import { registerSchema } from '@/lib/schemas/auth.schema';
import { registerUser } from '@/lib/actions/auth';
import type { RegisterInput } from '@/lib/schemas/auth.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type FieldErrors = Partial<Record<keyof RegisterInput, string>>;

const EMPLOYMENT_OPTIONS = [
  { value: 'EMPLOYED', label: 'Employee', description: 'I work as an employee (PAYE / salaried)' },
  { value: 'SOLE_TRADER', label: 'Sole Trader', description: 'I am self-employed or a freelancer' },
  { value: 'BOTH', label: 'Both', description: 'I am both employed and self-employed' },
] as const;

export function RegisterForm(): React.JSX.Element {
  const [values, setValues] = useState<RegisterInput>({
    name: '',
    email: '',
    employmentType: 'EMPLOYED',
    password: '',
    confirmPassword: '',
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [rootError, setRootError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isSuccess, setIsSuccess] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name as keyof RegisterInput]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    setRootError(null);

    const parsed = registerSchema.safeParse(values);
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        name: flat.name?.[0],
        email: flat.email?.[0],
        employmentType: flat.employmentType?.[0],
        password: flat.password?.[0],
        confirmPassword: flat.confirmPassword?.[0],
      });
      return;
    }

    startTransition(async () => {
      const result = await registerUser(parsed.data);

      if (!result.success) {
        if (result.error.fields) {
          const mapped: FieldErrors = {};
          for (const [key, msgs] of Object.entries(result.error.fields)) {
            mapped[key as keyof RegisterInput] = msgs[0];
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
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/5">
          <CheckCircle className="h-6 w-6 text-primary" aria-hidden="true" />
        </div>
        <h3 className="mb-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">Registration submitted!</h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Your account is pending approval by an administrator. You will be able to sign in once activated.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold text-zinc-900 dark:text-zinc-50">Create your account</h2>

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
        <div className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              value={values.name}
              onChange={handleChange}
              disabled={isPending}
              aria-invalid={!!fieldErrors.name}
              aria-describedby={fieldErrors.name ? 'name-error' : undefined}
              placeholder="Jane Doe"
            />
            {fieldErrors.name && (
              <p id="name-error" role="alert" className="text-xs text-red-600 dark:text-red-400">
                {fieldErrors.name}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={values.email}
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

          <div className="space-y-1.5">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">How do you work?</p>
            <div className="flex flex-col gap-2" role="radiogroup" aria-label="Employment type">
              {EMPLOYMENT_OPTIONS.map(({ value, label, description }) => (
                <label
                  key={value}
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors',
                    isPending && 'cursor-not-allowed opacity-50',
                    values.employmentType === value
                      ? 'border-primary/80 bg-primary/5 dark:border-primary'
                      : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600',
                  )}
                >
                  <input
                    type="radio"
                    name="employmentType"
                    value={value}
                    checked={values.employmentType === value}
                    onChange={handleChange}
                    disabled={isPending}
                    className="mt-0.5 accent-primary"
                  />
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{label}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
                  </div>
                </label>
              ))}
            </div>
            {fieldErrors.employmentType && (
              <p role="alert" className="text-xs text-red-600 dark:text-red-400">
                {fieldErrors.employmentType}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={values.password}
              onChange={handleChange}
              disabled={isPending}
              aria-invalid={!!fieldErrors.password}
              aria-describedby={fieldErrors.password ? 'password-error' : 'password-hint'}
              placeholder="Min. 8 chars, 1 uppercase, 1 number"
            />
            {fieldErrors.password ? (
              <p id="password-error" role="alert" className="text-xs text-red-600 dark:text-red-400">
                {fieldErrors.password}
              </p>
            ) : (
              <p id="password-hint" className="text-xs text-zinc-400 dark:text-zinc-500">
                At least 8 characters, one uppercase letter, and one number.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={values.confirmPassword}
              onChange={handleChange}
              disabled={isPending}
              aria-invalid={!!fieldErrors.confirmPassword}
              aria-describedby={fieldErrors.confirmPassword ? 'confirm-password-error' : undefined}
              placeholder="••••••••"
            />
            {fieldErrors.confirmPassword && (
              <p id="confirm-password-error" role="alert" className="text-xs text-red-600 dark:text-red-400">
                {fieldErrors.confirmPassword}
              </p>
            )}
          </div>
        </div>

        <Button type="submit" disabled={isPending} aria-busy={isPending} className="mt-6 w-full" size="lg">
          {isPending ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-primary hover:text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
