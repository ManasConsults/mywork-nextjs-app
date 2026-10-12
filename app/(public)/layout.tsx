import Link from 'next/link';
import type { ReactNode } from 'react';

import { PublicFooter } from '@/components/legal/PublicFooter';

export default function PublicLayout({ children }: { children: ReactNode }): React.JSX.Element {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <div className="px-3 pt-3 pb-1">
        <header className="mx-auto flex h-14 max-w-5xl items-center justify-between rounded-2xl border border-border/60 bg-background/90 px-4 backdrop-blur-sm shadow-[0_4px_20px_rgba(0,0,0,0.08),0_1px_4px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4),0_1px_4px_rgba(0,0,0,0.25)]">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center text-xl font-bold tracking-tight text-primary"
          >
            MyWork
          </Link>
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            Sign in
          </Link>
        </header>
      </div>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6">{children}</main>
      <PublicFooter />
    </div>
  );
}
