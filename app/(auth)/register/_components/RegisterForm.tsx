'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';

import { registerSchema } from '@/lib/schemas/auth.schema';
import { registerUser } from '@/lib/actions/auth';
import type { RegisterInput } from '@/lib/schemas/auth.schema';

type FieldErrors = Partial<Record<keyof RegisterInput, string>>;

const EMPLOYMENT_OPTIONS = [
  { value: 'EMPLOYED', label: 'Employee', description: 'I work as an employee (PAYE / salaried)' },
  { value: 'SOLE_TRADER', label: 'Sole Trader', description: 'I am self-employed or a freelancer' },
  { value: 'BOTH', label: 'Both', description: 'I am both employed and self-employed' },
] as const;

const INPUT_BASE =
  'block w-full rounded-lg border px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 bg-white dark:bg-zinc-800 disabled:opacity-50 disabled:bg-zinc-50 dark:disabled:bg-zinc-900 transition-colors focus:outline-none focus:ring-2';

const INPUT_NORMAL = `${INPUT_BASE} border-zinc-200 dark:border-zinc-700 focus:ring-teal-600 dark:focus:ring-zinc-400`;
const INPUT_ERROR  = `${INPUT_BASE} border-red-400 focus:ring-red-400`;

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
      <div role="status" className="text-center py-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-teal-50 dark:bg-teal-900/30 mx-auto mb-4">
          <svg className="w-6 h-6 text-teal-600 dark:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-1">Registration submitted!</h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Your account is pending approval by an administrator. You will be able to sign in once activated.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-6">Create your account</h2>

      {rootError && (
        <div
          role="alert"
          aria-live="assertive"
          className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400"
        >
          {rootError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col gap-4">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Full name
            </label>
            <input
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
              className={fieldErrors.name ? INPUT_ERROR : INPUT_NORMAL}
            />
            {fieldErrors.name && (
              <p id="name-error" role="alert" className="mt-1.5 text-xs text-red-600 dark:text-red-400">
                {fieldErrors.name}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Email address
            </label>
            <input
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
              className={fieldErrors.email ? INPUT_ERROR : INPUT_NORMAL}
            />
            {fieldErrors.email && (
              <p id="email-error" role="alert" className="mt-1.5 text-xs text-red-600 dark:text-red-400">
                {fieldErrors.email}
              </p>
            )}
          </div>

          {/* Employment type */}
          <div>
            <p className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              How do you work?
            </p>
            <div className="flex flex-col gap-2" role="radiogroup" aria-label="Employment type">
              {EMPLOYMENT_OPTIONS.map(({ value, label, description }) => (
                <label
                  key={value}
                  className={[
                    'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors',
                    isPending ? 'opacity-50 cursor-not-allowed' : '',
                    values.employmentType === value
                      ? 'border-teal-500 bg-teal-50 dark:border-teal-600 dark:bg-teal-900/20'
                      : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600',
                  ].join(' ')}
                >
                  <input
                    type="radio"
                    name="employmentType"
                    value={value}
                    checked={values.employmentType === value}
                    onChange={handleChange}
                    disabled={isPending}
                    className="mt-0.5 accent-teal-600"
                  />
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{label}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
                  </div>
                </label>
              ))}
            </div>
            {fieldErrors.employmentType && (
              <p role="alert" className="mt-1.5 text-xs text-red-600 dark:text-red-400">
                {fieldErrors.employmentType}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Password
            </label>
            <input
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
              className={fieldErrors.password ? INPUT_ERROR : INPUT_NORMAL}
            />
            {fieldErrors.password ? (
              <p id="password-error" role="alert" className="mt-1.5 text-xs text-red-600 dark:text-red-400">
                {fieldErrors.password}
              </p>
            ) : (
              <p id="password-hint" className="mt-1.5 text-xs text-zinc-400 dark:text-zinc-500">
                At least 8 characters, one uppercase letter, and one number.
              </p>
            )}
          </div>

          {/* Confirm password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Confirm password
            </label>
            <input
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
              className={fieldErrors.confirmPassword ? INPUT_ERROR : INPUT_NORMAL}
            />
            {fieldErrors.confirmPassword && (
              <p id="confirm-password-error" role="alert" className="mt-1.5 text-xs text-red-600 dark:text-red-400">
                {fieldErrors.confirmPassword}
              </p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          aria-busy={isPending}
          className="mt-6 w-full rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white
                     hover:bg-teal-700 focus-visible:outline-none focus-visible:ring-2
                     focus-visible:ring-teal-600 focus-visible:ring-offset-2
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                     dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {isPending ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
        Already have an account?{' '}
        <Link href="/login" className="text-teal-600 dark:text-teal-400 font-medium hover:text-teal-700 dark:hover:text-teal-300 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
