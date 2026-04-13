'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  SquareCheckBig,
  Clock,
  Trophy,
  FileText,
  ListTodo,
  MessageSquare,
  LayoutGrid,
  Landmark,
  ArrowLeftRight,
  Tag,
  Users,
  Receipt,
  Timer,
  BarChart3,
  ShieldCheck,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
  icon: LucideIcon;
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
      { href: '/dashboard',    label: 'Dashboard',    icon: LayoutDashboard, alwaysShow: true },
      { href: '/tasks',        label: 'Tasks',        icon: SquareCheckBig },
      { href: '/work-logs',    label: 'Work Logs',    icon: Clock },
      { href: '/achievements', label: 'Achievements', icon: Trophy },
      { href: '/notes',        label: 'Notes',        icon: FileText },
      { href: '/todo',         label: 'To-do',        icon: ListTodo },
      { href: '/feedback',     label: 'My Feedback',  icon: MessageSquare },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    module: 'finance',
    links: [
      { href: '/finance',              label: 'Overview',     icon: LayoutGrid,    exact: true },
      { href: '/finance/accounts',     label: 'Accounts',     icon: Landmark },
      { href: '/finance/transactions', label: 'Transactions', icon: ArrowLeftRight },
      { href: '/finance/categories',   label: 'Categories',   icon: Tag },
      { href: '/finance/clients',      label: 'Clients',      icon: Users,    soleTraderOnly: true },
      { href: '/finance/invoices',     label: 'Invoices',     icon: Receipt,  soleTraderOnly: true },
      { href: '/finance/timesheets',   label: 'Timesheets',   icon: Timer,    soleTraderOnly: true },
      { href: '/finance/reports',      label: 'Reports',      icon: BarChart3 },
    ],
  },
];

function UserAvatar({ user, size }: { user: SidebarUser; size: 'sm' | 'md' }): React.JSX.Element {
  const dim = size === 'sm' ? 'h-5 w-5 text-[10px]' : 'h-7 w-7 text-xs';
  const initial = (user.name ?? user.email ?? '?')[0]?.toUpperCase() ?? '?';

  if (user.image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={user.image} alt="Avatar" className={cn('shrink-0 rounded-full object-cover', dim)} />
    );
  }

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-teal-100 font-semibold text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
        dim,
      )}
    >
      {initial}
    </span>
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
  const isSoleTrader = user.employmentType === 'SOLE_TRADER' || user.employmentType === 'BOTH';

  const visibleGroups = NAV_GROUPS.filter((group) => {
    if (group.module === 'finance') return user.moduleFinance !== false;
    return true;
  });

  return (
    <>
      <nav className="flex flex-1 flex-col gap-4 overflow-y-auto p-2">
        {visibleGroups.map((group, groupIdx) => {
          const visibleLinks = group.links.filter((link) => {
            if (link.alwaysShow) return true;
            if (group.module === 'work') return user.moduleWork !== false;
            if (link.soleTraderOnly && !isSoleTrader) return false;
            return true;
          });

          if (visibleLinks.length === 0) return null;

          return (
            <div key={group.id}>
              {groupIdx > 0 && <div className="mb-3 border-t border-zinc-200 dark:border-zinc-800" />}
              {!collapsed && (
                <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  {group.label}
                </p>
              )}
              <div className="flex flex-col gap-0.5">
                {visibleLinks.map(({ href, label, icon: Icon, exact }) => {
                  const isActive = exact
                    ? pathname === href
                    : pathname === href || pathname.startsWith(href + '/');

                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={onLinkClick}
                      title={collapsed ? label : undefined}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'flex min-h-9 items-center rounded-lg px-2 py-1.5 text-sm font-medium transition-colors',
                        collapsed ? 'justify-center' : 'gap-3',
                        isActive
                          ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300'
                          : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50',
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {!collapsed && label}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Admin */}
      {user.role === 'ADMIN' && (
        <div className="border-t border-zinc-200 p-2 dark:border-zinc-800">
          <Link
            href="/admin"
            onClick={onLinkClick}
            title={collapsed ? 'Admin' : undefined}
            className={cn(
              'flex min-h-9 items-center rounded-lg px-2 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50',
              collapsed ? 'justify-center' : 'gap-3',
            )}
          >
            <ShieldCheck className="h-4 w-4 shrink-0" />
            {!collapsed && 'Admin'}
          </Link>
        </div>
      )}

      {/* User footer */}
      <div className="border-t border-zinc-200 p-2 dark:border-zinc-800">
        {collapsed ? (
          <div className="flex flex-col items-center gap-1">
            <Link
              href="/profile"
              title="Profile"
              onClick={onLinkClick}
              className="flex min-h-9 w-full items-center justify-center rounded-lg p-1.5 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <UserAvatar user={user} size="sm" />
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              title="Sign out"
              className="flex min-h-9 w-full items-center justify-center rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            <Link
              href="/profile"
              onClick={onLinkClick}
              className="flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <UserAvatar user={user} size="md" />
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-zinc-900 dark:text-zinc-50">
                  {user.name ?? user.email}
                </p>
                {user.name && (
                  <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{user.email}</p>
                )}
              </div>
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="mt-1 flex min-h-9 w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-xs text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
            >
              <LogOut className="h-4 w-4 shrink-0" />
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

  useEffect(() => {
    onMobileClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
          aria-hidden="true"
          onClick={onMobileClose}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-zinc-200 bg-white shadow-xl transition-transform duration-200 dark:border-zinc-800 dark:bg-zinc-900 md:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        aria-label="Mobile navigation"
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200 px-4 dark:border-zinc-800">
          <span className="text-base font-semibold tracking-tight text-teal-600 dark:text-teal-400">
            MyWork
          </span>
          <button
            onClick={onMobileClose}
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <NavContent user={user} collapsed={false} onLinkClick={onMobileClose} />
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden shrink-0 flex-col border-r border-zinc-200 bg-white shadow-sm transition-all duration-200 dark:border-zinc-800 dark:bg-zinc-900 md:flex',
          collapsed ? 'w-12' : 'w-56',
        )}
        aria-label="Sidebar navigation"
      >
        <div className="flex h-14 shrink-0 items-center border-b border-zinc-200 px-3 dark:border-zinc-800">
          {!collapsed && (
            <span className="flex-1 text-base font-semibold tracking-tight text-teal-600 dark:text-teal-400">
              MyWork
            </span>
          )}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className={cn(
              'rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300',
              collapsed && 'mx-auto',
            )}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed
              ? <ChevronRight className="h-4 w-4" />
              : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
        <NavContent user={user} collapsed={collapsed} />
      </aside>
    </>
  );
}
