'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Sidebar } from './Sidebar';
import { ThemeToggle } from './ThemeToggle';
import { FeedbackButton } from './FeedbackButton';
import { cn } from '@/lib/utils';
import { getPageTitle } from '@/lib/utils/page-title';

interface SidebarUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string | null;
  moduleWork?: boolean;
  moduleFinance?: boolean;
  employmentType?: string | null;
}

export function AppShell({
  user,
  pendingCount,
  children,
}: {
  user: SidebarUser;
  pendingCount?: number;
  children: ReactNode;
}): React.JSX.Element {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);
  const isAdmin = user.role === 'ADMIN';
  const hasPending = isAdmin && (pendingCount ?? 0) > 0;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar user={user} mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Floating top bar */}
        <div className="shrink-0 px-3 pt-3 pb-1">
          <header
            className={cn(
              'flex h-14 items-center justify-between px-4',
              'rounded-2xl border border-border/60 bg-background/90 backdrop-blur-sm',
              'shadow-[0_4px_20px_rgba(0,0,0,0.08),0_1px_4px_rgba(0,0,0,0.05)]',
              'dark:shadow-[0_4px_20px_rgba(0,0,0,0.4),0_1px_4px_rgba(0,0,0,0.25)]',
            )}
          >
            {/* Left: hamburger (mobile) + page title */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:hidden"
                aria-label="Open navigation"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 12h18M3 6h18M3 18h18" />
                </svg>
              </button>
              <span className="text-base font-semibold text-foreground">
                {pageTitle}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <FeedbackButton />
              {isAdmin && (
                <Link
                  href="/admin/users"
                  aria-label={hasPending ? `${pendingCount} pending approval${(pendingCount ?? 0) > 1 ? 's' : ''}` : 'Notifications'}
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <span className="relative inline-flex">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                    {hasPending && (
                      <span className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold leading-none text-white">
                        {(pendingCount ?? 0) > 9 ? '9+' : pendingCount}
                      </span>
                    )}
                  </span>
                </Link>
              )}
              <ThemeToggle />
            </div>
          </header>
        </div>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
