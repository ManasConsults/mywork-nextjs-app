import Link from 'next/link';
import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';

import { authOptions } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { GlobalSearch } from './_components/GlobalSearch';

export const metadata: Metadata = { title: 'MyWork — Dashboard' };

export default async function DashboardPage(): Promise<React.JSX.Element> {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  // Monday of current week
  const daysFromMonday = todayStart.getDay() === 0 ? 6 : todayStart.getDay() - 1;
  const weekStart = new Date(todayStart);
  weekStart.setDate(todayStart.getDate() - daysFromMonday);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const [taskCounts, dueTodayTaskCount, workLogStats, overdueCount, todayTodosCount] = await Promise.all([
    prisma.task.groupBy({
      by: ['status'],
      where: { userId, deletedAt: null },
      _count: { id: true },
    }),
    prisma.task.count({
      where: {
        userId,
        deletedAt: null,
        dueDate: { gte: todayStart, lt: todayEnd },
        status: { not: 'DONE' },
      },
    }),
    prisma.workLog.aggregate({
      where: { userId, date: { gte: weekStart, lte: weekEnd } },
      _count: { id: true },
      _sum: { timeSpent: true },
    }),
    prisma.todoItem.count({
      where: { userId, isDone: false, dueDate: { lt: todayStart } },
    }),
    prisma.todoItem.count({
      where: { userId, isDone: false, dueDate: { gte: todayStart, lte: todayEnd } },
    }),
  ]);

  const byStatus = Object.fromEntries(taskCounts.map((c) => [c.status, c._count.id]));
  const totalOpen = (byStatus.BACKLOG ?? 0) + (byStatus.IN_PROGRESS ?? 0) + (byStatus.IN_REVIEW ?? 0);
  const blocked = byStatus.BLOCKED ?? 0;

  const weekLogCount = workLogStats._count.id;
  const weekHours = Math.round((workLogStats._sum.timeSpent ?? 0) * 10) / 10;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Dashboard</h1>

      <div style={{ marginTop: '1.5rem' }}>
        <GlobalSearch />
      </div>

      <section style={{ marginTop: '2.5rem' }}>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          Tasks
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          <StatCard label="Open" value={totalOpen} />
          <StatCard label="Blocked" value={blocked} accent="red" />
          <StatCard label="Due today" value={dueTodayTaskCount} accent="amber" />
        </div>
      </section>

      <section style={{ marginTop: '2.5rem' }}>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          Work Logs — this week
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
          <StatCard label="Log entries" value={weekLogCount} />
          <StatCard label="Hours logged" value={weekHours} suffix="h" />
        </div>
      </section>

      <section style={{ marginTop: '2.5rem' }}>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          To-dos
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
          <StatCard label="Overdue" value={overdueCount} accent="red" />
          <StatCard label="Due today" value={todayTodosCount} accent="amber" />
        </div>
      </section>

      <div style={{ marginTop: '2.5rem' }}>
        <Link
          href="/tasks"
          className="inline-flex items-center rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Go to Tasks
        </Link>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  suffix,
  accent,
}: {
  label: string;
  value: number;
  suffix?: string;
  accent?: 'red' | 'amber';
}): React.JSX.Element {
  const valueClass =
    accent === 'red'
      ? 'text-red-600 dark:text-red-400'
      : accent === 'amber'
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-zinc-900 dark:text-zinc-50';

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className={`mt-1 text-3xl font-semibold ${valueClass}`}>
        {value}
        {suffix && <span className="ml-0.5 text-lg font-medium">{suffix}</span>}
      </p>
    </div>
  );
}
