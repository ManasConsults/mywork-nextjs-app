import type { Metadata } from 'next';
import { Users, CheckSquare, Clock, Trophy, FileText, ListTodo } from 'lucide-react';

import { getAppUsageStats } from '@/lib/services/admin.service';
import type { UserUsageStats } from '@/lib/services/admin.service';

export const metadata: Metadata = { title: 'MyWork Admin — Dashboard' };

// ─── Relative time helper ─────────────────────────────────────────────────────

function relativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);

  if (diffSecs < 60) return 'just now';

  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths} month${diffMonths === 1 ? '' : 's'} ago`;

  const diffYears = Math.floor(diffMonths / 12);
  return `${diffYears} year${diffYears === 1 ? '' : 's'} ago`;
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
        <span className="text-zinc-400 dark:text-zinc-500">{icon}</span>
      </div>
      <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
        {value.toLocaleString()}
      </p>
    </div>
  );
}

// ─── Role badge ───────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }): React.JSX.Element {
  if (role === 'ADMIN') {
    return (
      <span className="inline-flex items-center rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-700 dark:bg-teal-900/30 dark:text-teal-400">
        Admin
      </span>
    );
  }
  if (role === 'MANAGER') {
    return (
      <span className="inline-flex items-center rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
        Manager
      </span>
    );
  }
  return (
    <span className="text-xs text-zinc-500 dark:text-zinc-400">Member</span>
  );
}

// ─── Avatar initials ──────────────────────────────────────────────────────────

function UserAvatar({ name, email }: { name: string | null; email: string }): React.JSX.Element {
  const initial = (name ?? email)[0]?.toUpperCase() ?? '?';
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-medium text-teal-700 dark:bg-teal-900/30 dark:text-teal-400">
      {initial}
    </span>
  );
}

// ─── Count cell ───────────────────────────────────────────────────────────────

function CountCell({ value }: { value: number }): React.JSX.Element {
  if (value === 0) {
    return <span className="text-zinc-300 dark:text-zinc-600">&#8212;</span>;
  }
  return <span>{value}</span>;
}

// ─── User activity table row ──────────────────────────────────────────────────

function UserRow({
  user,
  index,
}: {
  user: UserUsageStats;
  index: number;
}): React.JSX.Element {
  const isEven = index % 2 === 0;
  const rowBg = isEven
    ? 'bg-white dark:bg-zinc-900'
    : 'bg-zinc-50 dark:bg-zinc-800/50';

  return (
    <tr className={rowBg}>
      <td className="border-t border-zinc-100 px-4 py-3 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <UserAvatar name={user.name} email={user.email} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {user.name ?? <span className="italic text-zinc-400">No name</span>}
            </p>
            <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="border-t border-zinc-100 px-4 py-3 dark:border-zinc-800">
        <RoleBadge role={user.role} />
      </td>
      <td className="border-t border-zinc-100 px-4 py-3 text-sm text-zinc-700 tabular-nums dark:border-zinc-800 dark:text-zinc-300">
        <CountCell value={user.taskCount} />
      </td>
      <td className="border-t border-zinc-100 px-4 py-3 text-sm text-zinc-700 tabular-nums dark:border-zinc-800 dark:text-zinc-300">
        <CountCell value={user.workLogCount} />
      </td>
      <td className="border-t border-zinc-100 px-4 py-3 text-sm text-zinc-700 tabular-nums dark:border-zinc-800 dark:text-zinc-300">
        <CountCell value={user.achievementCount} />
      </td>
      <td className="border-t border-zinc-100 px-4 py-3 text-sm text-zinc-700 tabular-nums dark:border-zinc-800 dark:text-zinc-300">
        <CountCell value={user.noteCount} />
      </td>
      <td className="border-t border-zinc-100 px-4 py-3 text-sm text-zinc-700 tabular-nums dark:border-zinc-800 dark:text-zinc-300">
        <CountCell value={user.todoCount} />
      </td>
      <td className="border-t border-zinc-100 px-4 py-3 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        {user.lastActiveAt ? relativeTime(user.lastActiveAt) : <span className="text-zinc-300 dark:text-zinc-600">&#8212;</span>}
      </td>
    </tr>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminDashboardPage(): Promise<React.JSX.Element> {
  const stats = await getAppUsageStats();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Usage Dashboard</h1>
        <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
          Snapshot of activity across all users and modules.
        </p>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          label="Total Users"
          value={stats.totalUsers}
          icon={<Users size={16} aria-hidden="true" />}
        />
        <StatCard
          label="Tasks"
          value={stats.totalTasks}
          icon={<CheckSquare size={16} aria-hidden="true" />}
        />
        <StatCard
          label="Work Logs"
          value={stats.totalWorkLogs}
          icon={<Clock size={16} aria-hidden="true" />}
        />
        <StatCard
          label="Achievements"
          value={stats.totalAchievements}
          icon={<Trophy size={16} aria-hidden="true" />}
        />
        <StatCard
          label="Notes"
          value={stats.totalNotes}
          icon={<FileText size={16} aria-hidden="true" />}
        />
        <StatCard
          label="Todos"
          value={stats.totalTodos}
          icon={<ListTodo size={16} aria-hidden="true" />}
        />
      </div>

      {/* Per-user activity table */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Per-user Activity
        </h2>

        {stats.users.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-200 bg-white py-16 dark:border-zinc-800 dark:bg-zinc-900">
            <Users
              size={40}
              className="text-zinc-300 dark:text-zinc-600"
              aria-hidden="true"
            />
            <p className="mt-3 text-sm font-medium text-zinc-500 dark:text-zinc-400">No users yet</p>
            <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
              Users will appear here once they have been created.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
            <table className="w-full min-w-180 border-collapse text-left">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    User
                  </th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Role
                  </th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Tasks
                  </th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Work Logs
                  </th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Achievements
                  </th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Notes
                  </th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Todos
                  </th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Last Active
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.users.map((user, index) => (
                  <UserRow key={user.id} user={user} index={index} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
