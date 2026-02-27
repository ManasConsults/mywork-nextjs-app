'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';

import { registerSchema } from '@/lib/schemas/auth.schema';
import { registerUser } from '@/lib/actions/auth';
import type { RegisterInput } from '@/lib/schemas/auth.schema';

type FieldErrors = Partial<Record<keyof RegisterInput, string>>;

export function RegisterForm(): React.JSX.Element {
  const [values, setValues] = useState<RegisterInput>({
    name: '',
    email: '',
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
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mx-auto mb-4">
          <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Registration submitted!</h3>
        <p className="text-sm text-gray-500">Your account is pending approval by an administrator. You will be able to sign in once activated.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Create your account</h2>

      {rootError && (
        <div
          role="alert"
          aria-live="assertive"
          className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
        >
          {rootError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col gap-4">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
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
              className={[
                'block w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900',
                'placeholder:text-gray-400 bg-white',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                'disabled:opacity-50 disabled:bg-gray-50 transition-colors',
                fieldErrors.name
                  ? 'border-red-400 focus:ring-red-400 focus:border-red-400'
                  : 'border-gray-300',
              ].join(' ')}
            />
            {fieldErrors.name && (
              <p id="name-error" role="alert" className="mt-1.5 text-xs text-red-600">
                {fieldErrors.name}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
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
              className={[
                'block w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900',
                'placeholder:text-gray-400 bg-white',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                'disabled:opacity-50 disabled:bg-gray-50 transition-colors',
                fieldErrors.email
                  ? 'border-red-400 focus:ring-red-400 focus:border-red-400'
                  : 'border-gray-300',
              ].join(' ')}
            />
            {fieldErrors.email && (
              <p id="email-error" role="alert" className="mt-1.5 text-xs text-red-600">
                {fieldErrors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
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
              className={[
                'block w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900',
                'placeholder:text-gray-400 bg-white',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                'disabled:opacity-50 disabled:bg-gray-50 transition-colors',
                fieldErrors.password
                  ? 'border-red-400 focus:ring-red-400 focus:border-red-400'
                  : 'border-gray-300',
              ].join(' ')}
            />
            {fieldErrors.password ? (
              <p id="password-error" role="alert" className="mt-1.5 text-xs text-red-600">
                {fieldErrors.password}
              </p>
            ) : (
              <p id="password-hint" className="mt-1.5 text-xs text-gray-400">
                At least 8 characters, one uppercase letter, and one number.
              </p>
            )}
          </div>

          {/* Confirm password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
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
              className={[
                'block w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900',
                'placeholder:text-gray-400 bg-white',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                'disabled:opacity-50 disabled:bg-gray-50 transition-colors',
                fieldErrors.confirmPassword
                  ? 'border-red-400 focus:ring-red-400 focus:border-red-400'
                  : 'border-gray-300',
              ].join(' ')}
            />
            {fieldErrors.confirmPassword && (
              <p id="confirm-password-error" role="alert" className="mt-1.5 text-xs text-red-600">
                {fieldErrors.confirmPassword}
              </p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          aria-busy={isPending}
          className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white
                     hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2
                     focus-visible:ring-blue-500 focus-visible:ring-offset-2
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link href="/login" className="text-blue-600 font-medium hover:text-blue-700 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
