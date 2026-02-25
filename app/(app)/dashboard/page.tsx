import Link from 'next/link';
import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';

import { authOptions } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';

export const metadata: Metadata = { title: 'MyWork — Dashboard' };

export default async function DashboardPage(): Promise<React.JSX.Element> {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const [counts, dueTodayCount] = await Promise.all([
    prisma.task.groupBy({
      by: ['status'],
      where: { userId, deletedAt: null },
      _count: { id: true },
    }),
    prisma.task.count({
      where: {
        userId,
        deletedAt: null,
        dueDate: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(23, 59, 59, 999)),
        },
        status: { not: 'DONE' },
      },
    }),
  ]);

  const byStatus = Object.fromEntries(counts.map((c) => [c.status, c._count.id]));
  const totalOpen = (byStatus.BACKLOG ?? 0) + (byStatus.IN_PROGRESS ?? 0) + (byStatus.IN_REVIEW ?? 0);
  const blocked = byStatus.BLOCKED ?? 0;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Open tasks" value={totalOpen} />
        <StatCard label="Blocked" value={blocked} accent="red" />
        <StatCard label="Due today" value={dueTodayCount} accent="amber" />
      </div>

      <div className="mt-8">
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
  accent,
}: {
  label: string;
  value: number;
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
      <p className={`mt-1 text-3xl font-semibold ${valueClass}`}>{value}</p>
    </div>
  );
}
