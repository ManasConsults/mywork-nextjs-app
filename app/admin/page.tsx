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
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="mt-1 text-xs text-muted-foreground">{label}</p>
        <span className="text-muted-foreground">{icon}</span>
      </div>
      <p className="mt-2 text-3xl font-bold text-foreground">
        {value.toLocaleString()}
      </p>
    </div>
  );
}

// ─── Role badge ───────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }): React.JSX.Element {
  if (role === 'ADMIN') {
    return (
      <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
        Admin
      </span>
    );
  }
  if (role === 'MANAGER') {
    return (
      <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
        Manager
      </span>
    );
  }
  return (
    <span className="text-xs text-muted-foreground">Member</span>
  );
}

// ─── Avatar initials ──────────────────────────────────────────────────────────

function UserAvatar({ name, email }: { name: string | null; email: string }): React.JSX.Element {
  const initial = (name ?? email)[0]?.toUpperCase() ?? '?';
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
      {initial}
    </span>
  );
}

// ─── Count cell ───────────────────────────────────────────────────────────────

function CountCell({ value }: { value: number }): React.JSX.Element {
  if (value === 0) {
    return <span className="text-muted-foreground/40">&#8212;</span>;
  }
  return <span>{value}</span>;
}

// ─── User activity table row ──────────────────────────────────────────────────

function UserRow({
  user,
}: {
  user: UserUsageStats;
}): React.JSX.Element {
  return (
    <tr className="hover:bg-muted/30 transition-colors">
      <td className="border-t border-border/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <UserAvatar name={user.name} email={user.email} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {user.name ?? <span className="italic text-muted-foreground">No name</span>}
            </p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="border-t border-border/60 px-4 py-3">
        <RoleBadge role={user.role} />
      </td>
      <td className="border-t border-border/60 px-4 py-3 text-sm text-foreground tabular-nums">
        <CountCell value={user.taskCount} />
      </td>
      <td className="border-t border-border/60 px-4 py-3 text-sm text-foreground tabular-nums">
        <CountCell value={user.workLogCount} />
      </td>
      <td className="border-t border-border/60 px-4 py-3 text-sm text-foreground tabular-nums">
        <CountCell value={user.achievementCount} />
      </td>
      <td className="border-t border-border/60 px-4 py-3 text-sm text-foreground tabular-nums">
        <CountCell value={user.noteCount} />
      </td>
      <td className="border-t border-border/60 px-4 py-3 text-sm text-foreground tabular-nums">
        <CountCell value={user.todoCount} />
      </td>
      <td className="border-t border-border/60 px-4 py-3 text-xs text-muted-foreground">
        {user.lastActiveAt ? relativeTime(user.lastActiveAt) : <span className="text-muted-foreground/40">&#8212;</span>}
      </td>
    </tr>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminDashboardPage(): Promise<React.JSX.Element> {
  const stats = await getAppUsageStats();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
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
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          Per-user Activity
        </h2>

        {stats.users.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16">
            <Users
              size={40}
              className="text-muted-foreground"
              aria-hidden="true"
            />
            <p className="mt-3 text-sm font-medium text-muted-foreground">No users yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Users will appear here once they have been created.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full min-w-180 border-collapse text-left">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    User
                  </th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Role
                  </th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Tasks
                  </th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Work Logs
                  </th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Achievements
                  </th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Notes
                  </th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Todos
                  </th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Last Active
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.users.map((user) => (
                  <UserRow key={user.id} user={user} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
