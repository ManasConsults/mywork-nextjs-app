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

export default async function AdminLayout({ children }: { children: ReactNode }): Promise<React.JSX.Element> {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  const user = session.user as { role?: string };
  if (user.role !== 'ADMIN') redirect('/dashboard');

  return (
    <div className="min-h-screen bg-background">
      <div className="shrink-0 px-3 pt-3 pb-1">
        <header className="flex h-14 items-center justify-between gap-4 px-4 rounded-2xl border border-border/60 bg-background/90 backdrop-blur-sm
          shadow-[0_4px_20px_rgba(0,0,0,0.08),0_1px_4px_rgba(0,0,0,0.05)]
          dark:shadow-[0_4px_20px_rgba(0,0,0,0.4),0_1px_4px_rgba(0,0,0,0.25)]">
          <div className="flex items-center gap-5 min-w-0">
            <span className="shrink-0 font-bold text-[0.9375rem] text-primary">
              MyWork Admin
            </span>
            <nav className="flex items-center gap-1">
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <AdminPageTitle />
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
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
