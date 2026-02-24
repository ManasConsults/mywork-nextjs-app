'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useState, useTransition } from 'react';

import { loginSchema } from '@/lib/schemas/auth.schema';
import type { LoginInput } from '@/lib/schemas/auth.schema';

type FieldErrors = Partial<Record<keyof LoginInput, string>>;

const OAUTH_PROVIDERS = [
  {
    id: 'github',
    label: 'Continue with GitHub',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.73.083-.73 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23A11.5 11.5 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.29-1.552 3.297-1.23 3.297-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.807 5.625-5.48 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z" />
      </svg>
    ),
    className: 'bg-gray-900 text-white hover:bg-gray-800 focus-visible:ring-gray-700',
  },
  {
    id: 'google',
    label: 'Continue with Google',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
    ),
    className: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus-visible:ring-gray-400',
  },
  {
    id: 'facebook',
    label: 'Continue with Facebook',
    icon: (
      <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.97h-1.513c-1.491 0-1.956.93-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
      </svg>
    ),
    className: 'bg-[#1877F2] text-white hover:bg-[#166FE5] focus-visible:ring-blue-500',
  },
] as const;

export function LoginForm(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard';

  const [values, setValues] = useState<LoginInput>({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [rootError, setRootError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (fieldErrors[name as keyof LoginInput]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    setRootError(null);

    const parsed = loginSchema.safeParse(values);
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        email: flat.email?.[0],
        password: flat.password?.[0],
      });
      return;
    }

    startTransition(async () => {
      const result = await signIn('credentials', {
        redirect: false,
        email: parsed.data.email,
        password: parsed.data.password,
        callbackUrl,
      });

      if (result?.error) {
        setRootError('Invalid email or password. Please try again.');
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    });
  }

  function handleOAuth(provider: string): void {
    startTransition(async () => {
      await signIn(provider, { callbackUrl });
    });
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Sign in to your account</h2>

      {/* OAuth buttons */}
      <div className="flex flex-col gap-3 mb-6">
        {OAUTH_PROVIDERS.map((provider) => (
          <button
            key={provider.id}
            type="button"
            onClick={() => handleOAuth(provider.id)}
            disabled={isPending}
            aria-label={provider.label}
            className={[
              'flex items-center justify-center gap-3 w-full rounded-lg px-4 py-2.5',
              'text-sm font-medium transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              provider.className,
            ].join(' ')}
          >
            {provider.icon}
            {provider.label}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-3 text-gray-400">or continue with email</span>
        </div>
      </div>

      {/* Root error */}
      {rootError && (
        <div
          role="alert"
          aria-live="assertive"
          className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
        >
          {rootError}
        </div>
      )}

      {/* Credentials form */}
      <form onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col gap-4">
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
                'disabled:opacity-50 disabled:bg-gray-50',
                'transition-colors',
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
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={values.password}
              onChange={handleChange}
              disabled={isPending}
              aria-invalid={!!fieldErrors.password}
              aria-describedby={fieldErrors.password ? 'password-error' : undefined}
              placeholder="••••••••"
              className={[
                'block w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900',
                'placeholder:text-gray-400 bg-white',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                'disabled:opacity-50 disabled:bg-gray-50',
                'transition-colors',
                fieldErrors.password
                  ? 'border-red-400 focus:ring-red-400 focus:border-red-400'
                  : 'border-gray-300',
              ].join(' ')}
            />
            {fieldErrors.password && (
              <p id="password-error" role="alert" className="mt-1.5 text-xs text-red-600">
                {fieldErrors.password}
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
          {isPending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-blue-600 font-medium hover:text-blue-700 hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
