import type { ReactNode } from 'react';

import { PublicFooter } from '@/components/legal/PublicFooter';

// Session-dependent; also keeps next-auth/react out of build-time evaluation (see (auth)/layout.tsx).
export const dynamic = 'force-dynamic';

export default function ConsentLayout({ children }: { children: ReactNode }): React.JSX.Element {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <p className="mb-6 text-center text-3xl font-bold tracking-tight text-foreground">MyWork</p>
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">{children}</div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
