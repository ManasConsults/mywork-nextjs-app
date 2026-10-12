import type { ReactNode } from 'react';
import type { Metadata } from 'next';

import { PublicFooter } from '@/components/legal/PublicFooter';

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
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Logo / wordmark */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">MyWork</h1>
            <p className="mt-1 text-sm text-muted-foreground">Your personal work management workspace</p>
          </div>

          {/* Card */}
          <div className="bg-card rounded-2xl border border-border p-8">
            {children}
          </div>
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
