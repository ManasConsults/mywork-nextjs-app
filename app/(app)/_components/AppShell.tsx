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
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Sidebar user={user} mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <div className="flex flex-1 flex-col min-w-0">
        {/* Top bar */}
        <div className="flex h-12 shrink-0 items-center justify-between px-4 md:justify-end">
          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 md:hidden"
            aria-label="Open navigation"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>

          <div className="flex items-center gap-1">
            <FeedbackButton />
            {isAdmin && (
              <Link
                href="/admin/users"
                aria-label={hasPending ? `${pendingCount} pending approval${(pendingCount ?? 0) > 1 ? 's' : ''}` : 'Notifications'}
                className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
              >
                <span className="relative inline-flex">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  {hasPending && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
                      {(pendingCount ?? 0) > 9 ? '9+' : pendingCount}
                    </span>
                  )}
                </span>
              </Link>
            )}
            <ThemeToggle />
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
