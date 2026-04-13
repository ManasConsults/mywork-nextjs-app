import { prisma } from '@/lib/db/prisma';

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
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className={`mt-2 text-3xl font-semibold tracking-tight ${valueClass}`}>
        {value}
        {suffix && <span className="ml-0.5 text-lg font-medium">{suffix}</span>}
      </p>
    </div>
  );
}

export async function DashboardStatsServer({
  userId,
}: {
  userId: string;
}): Promise<React.JSX.Element> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const daysFromMonday = todayStart.getDay() === 0 ? 6 : todayStart.getDay() - 1;
  const weekStart = new Date(todayStart);
  weekStart.setDate(todayStart.getDate() - daysFromMonday);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const [taskCounts, dueTodayTaskCount, workLogStats, overdueCount, todayTodosCount] =
    await Promise.all([
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
    <>
      <section className="mt-10">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          Tasks
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Open" value={totalOpen} />
          <StatCard label="Blocked" value={blocked} accent="red" />
          <StatCard label="Due today" value={dueTodayTaskCount} accent="amber" />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          Work Logs — this week
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard label="Log entries" value={weekLogCount} />
          <StatCard label="Hours logged" value={weekHours} suffix="h" />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          To-dos
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard label="Overdue" value={overdueCount} accent="red" />
          <StatCard label="Due today" value={todayTodosCount} accent="amber" />
        </div>
      </section>
    </>
  );
}
