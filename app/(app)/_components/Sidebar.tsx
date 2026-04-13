'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

interface SidebarUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string | null;
  moduleWork?: boolean;
  moduleFinance?: boolean;
  employmentType?: string | null;
}

interface SidebarProps {
  user: SidebarUser;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

interface NavLink {
  href: string;
  label: string;
  icon: readonly string[];
  exact?: boolean;
  alwaysShow?: boolean;
  soleTraderOnly?: boolean;
}

interface NavGroup {
  id: string;
  label: string;
  module: 'work' | 'finance';
  links: NavLink[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    id: 'work',
    label: 'Work',
    module: 'work',
    links: [
      {
        href: '/dashboard',
        label: 'Dashboard',
        alwaysShow: true,
        icon: ['M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'M9 22V12h6v10'],
      },
      {
        href: '/tasks',
        label: 'Tasks',
        icon: ['M9 11l3 3L22 4', 'M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11'],
      },
      {
        href: '/work-logs',
        label: 'Work Logs',
        icon: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20', 'M12 6v6l4 2'],
      },
      {
        href: '/achievements',
        label: 'Achievements',
        icon: ['M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'],
      },
      {
        href: '/notes',
        label: 'Notes',
        icon: ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', 'M14 2v6h6', 'M16 13H8', 'M16 17H8', 'M10 9H8'],
      },
      {
        href: '/todo',
        label: 'To-do',
        icon: ['M8 6h13', 'M8 12h13', 'M8 18h13', 'M3 6h.01', 'M3 12h.01', 'M3 18h.01'],
      },
      {
        href: '/feedback',
        label: 'My Feedback',
        icon: ['M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'],
      },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    module: 'finance',
    links: [
      {
        href: '/finance',
        label: 'Overview',
        exact: true,
        icon: ['M3 3h18v18H3z', 'M3 9h18', 'M9 21V9'],
      },
      {
        href: '/finance/accounts',
        label: 'Accounts',
        icon: ['M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'M9 22V12h6v10'],
      },
      {
        href: '/finance/transactions',
        label: 'Transactions',
        icon: ['M12 1v22', 'M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'],
      },
      {
        href: '/finance/categories',
        label: 'Categories',
        icon: ['M4 6h16', 'M4 12h8', 'M4 18h4'],
      },
      {
        href: '/finance/clients',
        label: 'Clients',
        icon: ['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2', 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8', 'M23 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75'],
        soleTraderOnly: true,
      },
      {
        href: '/finance/invoices',
        label: 'Invoices',
        icon: ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', 'M14 2v6h6', 'M16 13H8', 'M16 17H8', 'M10 9H8'],
        soleTraderOnly: true,
      },
      {
        href: '/finance/timesheets',
        label: 'Timesheets',
        icon: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20', 'M12 6v6l4 2'],
        soleTraderOnly: true,
      },
      {
        href: '/finance/reports',
        label: 'Reports',
        icon: ['M18 20V10', 'M12 20V4', 'M6 20v-6'],
      },
    ],
  },
];

const SIGN_OUT_ICON = ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'M16 17l5-5-5-5', 'M21 12H9'];

function NavIcon({ paths }: { paths: readonly string[] }): React.JSX.Element {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      {paths.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}

function ChevronLeft(): React.JSX.Element {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function ChevronRight(): React.JSX.Element {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

function CloseIcon(): React.JSX.Element {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function NavContent({
  user,
  collapsed,
  onLinkClick,
}: {
  user: SidebarUser;
  collapsed: boolean;
  onLinkClick?: () => void;
}): React.JSX.Element {
  const pathname = usePathname();

  const visibleGroups = NAV_GROUPS.filter((group) => {
    if (group.module === 'finance') return user.moduleFinance !== false;
    return true; // Work group always shown (Dashboard is always-visible within it)
  });

  return (
    <>
      <nav className="flex flex-1 flex-col gap-4 p-2 overflow-y-auto">
        {visibleGroups.map((group, groupIdx) => {
          const isSoleTrader = user.employmentType === 'SOLE_TRADER' || user.employmentType === 'BOTH';
          const visibleLinks = group.links.filter((link) => {
            if (link.alwaysShow) return true;
            if (group.module === 'work') return user.moduleWork !== false;
            if (link.soleTraderOnly && !isSoleTrader) return false;
            return true; // Finance links shown if the group is visible
          });

          if (visibleLinks.length === 0) return null;

          return (
            <div key={group.id}>
              {groupIdx > 0 && (
                <div className="mb-3 border-t border-zinc-200 dark:border-zinc-800" />
              )}
              {!collapsed && (
                <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  {group.label}
                </p>
              )}
              <div className="flex flex-col gap-0.5">
                {visibleLinks.map(({ href, label, icon, exact }) => {
                  const isActive = exact
                    ? pathname === href
                    : pathname === href || pathname.startsWith(href + '/');
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={onLinkClick}
                      title={collapsed ? label : undefined}
                      className={`flex items-center rounded-md px-2 py-2 text-sm font-medium transition-colors ${
                        collapsed ? 'justify-center' : 'gap-3'
                      } ${
                        isActive
                          ? 'bg-teal-50 text-teal-700 dark:bg-zinc-800 dark:text-zinc-50'
                          : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50'
                      }`}
                    >
                      <NavIcon paths={icon} />
                      {!collapsed && label}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {user.role === 'ADMIN' && (
        <div className="border-t border-zinc-200 p-2 dark:border-zinc-800">
          <Link
            href="/admin"
            onClick={onLinkClick}
            title={collapsed ? 'Admin' : undefined}
            className={`flex items-center rounded-md px-2 py-2 text-sm font-medium transition-colors ${
              collapsed ? 'justify-center' : 'gap-3'
            } text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50`}
          >
            <NavIcon paths={['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z']} />
            {!collapsed && 'Admin'}
          </Link>
        </div>
      )}

      <div className="border-t border-zinc-200 p-2 dark:border-zinc-800">
        {collapsed ? (
          <div className="flex flex-col items-center gap-1">
            <Link
              href="/profile"
              title="Profile"
              onClick={onLinkClick}
              className="flex w-full items-center justify-center rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
            >
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.image} alt="Avatar" className="h-5 w-5 rounded-full object-cover" />
              ) : (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-100 text-[10px] font-semibold text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
                  {(user.name ?? user.email ?? '?')[0]?.toUpperCase()}
                </span>
              )}
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              title="Sign out"
              className="flex w-full items-center justify-center rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
            >
              <NavIcon paths={SIGN_OUT_ICON} />
            </button>
          </div>
        ) : (
          <>
            <Link
              href="/profile"
              onClick={onLinkClick}
              className="flex items-center gap-2 rounded-md px-1 py-1.5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800"
            >
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.image} alt="Avatar" className="h-6 w-6 rounded-full object-cover" />
              ) : (
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-semibold text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
                  {(user.name ?? user.email ?? '?')[0]?.toUpperCase()}
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-zinc-900 dark:text-zinc-50">
                  {user.name ?? user.email}
                </p>
                {user.name && (
                  <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{user.email}</p>
                )}
              </div>
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="mt-1 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
            >
              <NavIcon paths={SIGN_OUT_ICON} />
              Sign out
            </button>
          </>
        )}
      </div>
    </>
  );
}

export function Sidebar({ user, mobileOpen, onMobileClose }: SidebarProps): React.JSX.Element {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  // Close mobile drawer on navigation
  useEffect(() => {
    onMobileClose();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          aria-hidden="true"
          onClick={onMobileClose}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-zinc-200 bg-white transition-transform duration-200 dark:border-zinc-800 dark:bg-zinc-900 md:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Mobile navigation"
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200 px-3 dark:border-zinc-800">
          <span className="text-lg font-semibold tracking-tight text-teal-600 dark:text-teal-400">
            MyWork
          </span>
          <button
            onClick={onMobileClose}
            className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            aria-label="Close navigation"
          >
            <CloseIcon />
          </button>
        </div>
        <NavContent user={user} collapsed={false} onLinkClick={onMobileClose} />
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`hidden shrink-0 flex-col border-r border-zinc-200 bg-white transition-all duration-200 dark:border-zinc-800 dark:bg-zinc-900 md:flex overflow-y-auto ${
          collapsed ? 'w-12' : 'w-56'
        }`}
        aria-label="Sidebar navigation"
      >
        <div className="flex h-14 shrink-0 items-center border-b border-zinc-200 px-3 dark:border-zinc-800">
          {!collapsed && (
            <span className="flex-1 text-lg font-semibold tracking-tight text-teal-600 dark:text-teal-400">
              MyWork
            </span>
          )}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className={`rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 ${
              collapsed ? 'mx-auto' : ''
            }`}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight /> : <ChevronLeft />}
          </button>
        </div>
        <NavContent user={user} collapsed={collapsed} />
      </aside>
    </>
  );
}
