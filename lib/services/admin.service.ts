import { prisma } from '@/lib/db/prisma';

export interface UserUsageStats {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: Date;
  taskCount: number;
  workLogCount: number;
  achievementCount: number;
  noteCount: number;
  todoCount: number;
  lastActiveAt: Date | null;
}

export interface AppUsageStats {
  totalUsers: number;
  totalTasks: number;
  totalWorkLogs: number;
  totalAchievements: number;
  totalNotes: number;
  totalTodos: number;
  users: UserUsageStats[];
}

/**
 * Fetches aggregated usage statistics across all users.
 *
 * Soft-delete filter (deletedAt: null) is applied to tasks, achievements and
 * notes. WorkLog and TodoItem have no soft-delete column per the schema.
 *
 * Two concurrent operations are issued:
 *  1. A $transaction with all PrismaPromise count/findMany queries.
 *  2. A Promise.all of groupBy queries to find the most-recent createdAt per
 *     user per module, used to compute lastActiveAt.
 *
 * Both are awaited in parallel via an outer Promise.all to minimise latency.
 */
export async function getAppUsageStats(): Promise<AppUsageStats> {
  const [totalsAndUsers, lastActiveDates] = await Promise.all([
    // ── Batch 1: counts + per-user _count in a single round-trip ──────────────
    prisma.$transaction([
      prisma.user.count(),
      prisma.task.count({ where: { deletedAt: null } }),
      prisma.workLog.count(),
      prisma.achievement.count({ where: { deletedAt: null } }),
      prisma.note.count({ where: { deletedAt: null } }),
      prisma.todoItem.count(),
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          _count: {
            select: {
              tasks: { where: { deletedAt: null } },
              workLogs: true,
              achievements: { where: { deletedAt: null } },
              notes: { where: { deletedAt: null } },
              todoItems: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
    ]),

    // ── Batch 2: most-recent createdAt per user per module ────────────────────
    Promise.all([
      prisma.task.groupBy({
        by: ['userId'],
        where: { deletedAt: null },
        _max: { createdAt: true },
      }),
      prisma.workLog.groupBy({
        by: ['userId'],
        _max: { createdAt: true },
      }),
      prisma.achievement.groupBy({
        by: ['userId'],
        where: { deletedAt: null },
        _max: { createdAt: true },
      }),
      prisma.note.groupBy({
        by: ['userId'],
        where: { deletedAt: null },
        _max: { createdAt: true },
      }),
      prisma.todoItem.groupBy({
        by: ['userId'],
        _max: { createdAt: true },
      }),
    ]),
  ]);

  const [
    totalUsers,
    totalTasks,
    totalWorkLogs,
    totalAchievements,
    totalNotes,
    totalTodos,
    rawUsers,
  ] = totalsAndUsers as [
    number,
    number,
    number,
    number,
    number,
    number,
    Array<{
      id: string;
      name: string | null;
      email: string;
      role: string;
      createdAt: Date;
      _count: {
        tasks: number;
        workLogs: number;
        achievements: number;
        notes: number;
        todoItems: number;
      };
    }>,
  ];

  // ── Build Map<userId, Date> of the most recent activity ───────────────────
  const [taskDates, workLogDates, achievementDates, noteDates, todoDates] = lastActiveDates;

  const lastActiveMap = new Map<string, Date>();

  function mergeDate(userId: string, candidate: Date | null | undefined): void {
    if (!candidate) return;
    const existing = lastActiveMap.get(userId);
    if (!existing || candidate > existing) {
      lastActiveMap.set(userId, candidate);
    }
  }

  for (const row of taskDates) mergeDate(row.userId, row._max.createdAt);
  for (const row of workLogDates) mergeDate(row.userId, row._max.createdAt);
  for (const row of achievementDates) mergeDate(row.userId, row._max.createdAt);
  for (const row of noteDates) mergeDate(row.userId, row._max.createdAt);
  for (const row of todoDates) mergeDate(row.userId, row._max.createdAt);

  const users: UserUsageStats[] = rawUsers.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    createdAt: u.createdAt,
    taskCount: u._count.tasks,
    workLogCount: u._count.workLogs,
    achievementCount: u._count.achievements,
    noteCount: u._count.notes,
    todoCount: u._count.todoItems,
    lastActiveAt: lastActiveMap.get(u.id) ?? null,
  }));

  // Sort by lastActiveAt descending (most recently active first); nulls last.
  users.sort((a, b) => {
    if (a.lastActiveAt === null && b.lastActiveAt === null) return 0;
    if (a.lastActiveAt === null) return 1;
    if (b.lastActiveAt === null) return -1;
    return b.lastActiveAt.getTime() - a.lastActiveAt.getTime();
  });

  return {
    totalUsers,
    totalTasks,
    totalWorkLogs,
    totalAchievements,
    totalNotes,
    totalTodos,
    users,
  };
}
