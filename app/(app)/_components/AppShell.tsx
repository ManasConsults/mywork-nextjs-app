'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';

import { Sidebar } from './Sidebar';
import { ThemeToggle } from './ThemeToggle';
import { FeedbackButton } from './FeedbackButton';

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
  const isAdmin = user.role === 'ADMIN';
  const hasPending = isAdmin && (pendingCount ?? 0) > 0;

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      <Sidebar user={user} mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 md:justify-end">
          {/* Brand + hamburger — mobile only */}
          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
              aria-label="Open navigation"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            </button>
            <span className="text-base font-semibold tracking-tight text-teal-600 dark:text-teal-400">
              MyWork
            </span>
          </div>

          <div className="flex items-center gap-1">
            <FeedbackButton />
            {isAdmin && (
              <Link
                href="/admin/users"
                aria-label={hasPending ? `${pendingCount} pending approval${(pendingCount ?? 0) > 1 ? 's' : ''}` : 'Notifications'}
                className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
              >
                <span className="relative inline-flex">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  {hasPending && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold leading-none text-white">
                      {(pendingCount ?? 0) > 9 ? '9+' : pendingCount}
                    </span>
                  )}
                </span>
              </Link>
            )}
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
