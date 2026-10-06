import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import type { ReactNode } from 'react';
import Link from 'next/link';

import { authOptions } from '@/lib/auth/auth';
import { AdminPageTitle } from './_components/AdminPageTitle';

const NAV_LINKS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/feedback', label: 'Feedback' },
] as const;

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: ReactNode }): Promise<React.JSX.Element> {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  const user = session.user as { role?: string };
  if (user.role !== 'ADMIN') redirect('/dashboard');

  return (
    <div className="min-h-screen bg-background">
      <div className="shrink-0 px-3 pt-3 pb-1">
        {/* Mobile: brand + back link on row one, nav on its own row. sm+: single 56px row. */}
        <header className="flex flex-wrap items-center justify-between gap-x-5 px-4 py-1 rounded-2xl border border-border/60 bg-background/90 backdrop-blur-sm sm:h-14 sm:flex-nowrap sm:py-0
          shadow-[0_4px_20px_rgba(0,0,0,0.08),0_1px_4px_rgba(0,0,0,0.05)]
          dark:shadow-[0_4px_20px_rgba(0,0,0,0.4),0_1px_4px_rgba(0,0,0,0.25)]">
          <span className="flex min-h-11 shrink-0 items-center font-bold text-[0.9375rem] text-primary">
            MyWork Admin
          </span>
          <nav className="order-last -mx-3 flex w-[calc(100%+1.5rem)] items-center gap-1 border-t border-border/60 py-1 sm:order-none sm:mx-0 sm:mr-auto sm:w-auto sm:border-t-0 sm:py-0">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg px-3 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors sm:min-h-0 sm:flex-none sm:py-1.5"
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-4 shrink-0">
            <span className="hidden sm:inline">
              <AdminPageTitle />
            </span>
            <Link
              href="/dashboard"
              className="inline-flex min-h-11 items-center text-sm text-muted-foreground hover:text-foreground transition-colors sm:min-h-0"
            >
              ← Back to app
            </Link>
          </div>
        </header>
      </div>
      <main className="bg-background mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
