import {
  SquareCheckBig,
  Ban,
  Clock,
  FileText,
  Timer,
  AlertTriangle,
  CalendarClock,
} from 'lucide-react';
import { prisma } from '@/lib/db/prisma';
import type { LucideIcon } from 'lucide-react';

type Accent = 'blue' | 'teal' | 'amber' | 'red' | 'purple' | 'emerald';

const ACCENT: Record<Accent, { ring: string; iconBg: string; icon: string; value: string }> = {
  blue:    { ring: 'border-blue-100 dark:border-blue-900/40',   iconBg: 'bg-blue-50 dark:bg-blue-950/50',    icon: 'text-blue-500',    value: 'text-blue-600 dark:text-blue-400' },
  teal:    { ring: 'border-teal-100 dark:border-teal-900/40',   iconBg: 'bg-teal-50 dark:bg-teal-950/50',    icon: 'text-teal-500',    value: 'text-teal-600 dark:text-teal-400' },
  amber:   { ring: 'border-amber-100 dark:border-amber-900/40', iconBg: 'bg-amber-50 dark:bg-amber-950/50',  icon: 'text-amber-500',   value: 'text-amber-600 dark:text-amber-400' },
  red:     { ring: 'border-red-100 dark:border-red-900/40',     iconBg: 'bg-red-50 dark:bg-red-950/50',      icon: 'text-red-500',     value: 'text-red-600 dark:text-red-400' },
  purple:  { ring: 'border-purple-100 dark:border-purple-900/40', iconBg: 'bg-purple-50 dark:bg-purple-950/50', icon: 'text-purple-500', value: 'text-purple-600 dark:text-purple-400' },
  emerald: { ring: 'border-emerald-100 dark:border-emerald-900/40', iconBg: 'bg-emerald-50 dark:bg-emerald-950/50', icon: 'text-emerald-500', value: 'text-emerald-600 dark:text-emerald-400' },
};

function StatCard({
  label,
  value,
  suffix,
  accent = 'blue',
  icon: Icon,
}: {
  label: string;
  value: number;
  suffix?: string;
  accent?: Accent;
  icon: LucideIcon;
}): React.JSX.Element {
  const a = ACCENT[accent];
  return (
    <div className={`rounded-xl border ${a.ring} bg-card p-5 transition-all duration-200 hover:-translate-y-0.5`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <div className={`rounded-lg p-2 ${a.iconBg}`}>
          <Icon className={`size-4 ${a.icon}`} />
        </div>
      </div>
      <p className={`mt-3 text-3xl font-bold tracking-tight ${a.value}`}>
        {value}
        {suffix && <span className="ml-0.5 text-lg font-semibold">{suffix}</span>}
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
        where: { userId, deletedAt: null, dueDate: { gte: todayStart, lt: todayEnd }, status: { not: 'DONE' } },
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
      <section className="mt-8">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tasks</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Open" value={totalOpen} accent="blue" icon={SquareCheckBig} />
          <StatCard label="Blocked" value={blocked} accent="red" icon={Ban} />
          <StatCard label="Due today" value={dueTodayTaskCount} accent="amber" icon={Clock} />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Work Logs — this week</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard label="Log entries" value={weekLogCount} accent="purple" icon={FileText} />
          <StatCard label="Hours logged" value={weekHours} suffix="h" accent="teal" icon={Timer} />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">To-dos</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard label="Overdue" value={overdueCount} accent="red" icon={AlertTriangle} />
          <StatCard label="Due today" value={todayTodosCount} accent="amber" icon={CalendarClock} />
        </div>
      </section>
    </>
  );
}
