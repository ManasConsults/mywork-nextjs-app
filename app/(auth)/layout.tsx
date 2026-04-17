import type { ReactNode } from 'react';
import type { Metadata } from 'next';

// next-auth/react (in the root layout's SessionProvider) calls new URL(NEXTAUTH_URL)
// during module evaluation. Prevent pre-rendering so that code only runs at request
// time when NEXTAUTH_URL is present.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'MyWork — Sign in',
};

export default function AuthLayout({
  children,
}: {
  children: ReactNode;
}): React.JSX.Element {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo / wordmark */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">MyWork</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Your personal work management workspace</p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
