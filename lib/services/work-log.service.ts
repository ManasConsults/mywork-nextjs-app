import type { WorkLog } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';
import { getTaskById } from '@/lib/services/task.service';
import type { CreateWorkLogInput, UpdateWorkLogInput, WorkLogFilters } from '@/lib/schemas/work-log.schema';
import { workLogFiltersSchema } from '@/lib/schemas/work-log.schema';

export type WorkLogWithTask = WorkLog & { task: { id: string; title: string } | null };

export interface PagedWorkLogs {
  logs: WorkLogWithTask[];
  total: number;
  totalHours: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function getWorkLogsByUser(
  userId: string,
  filters: WorkLogFilters = workLogFiltersSchema.parse({}),
): Promise<WorkLogWithTask[]> {
  return prisma.workLog.findMany({
    where: {
      userId,
      ...(filters.taskId ? { taskId: filters.taskId } : {}),
      ...(filters.dateFrom || filters.dateTo
        ? {
            date: {
              ...(filters.dateFrom ? { gte: filters.dateFrom } : {}),
              ...(filters.dateTo ? { lte: filters.dateTo } : {}),
            },
          }
        : {}),
    },
    include: { task: { select: { id: true, title: true } } },
    orderBy: { date: 'desc' },
  });
}

export async function getWorkLogsByUserPaged(
  userId: string,
  filters: WorkLogFilters,
): Promise<PagedWorkLogs> {
  const { taskId, dateFrom, dateTo, sortOrder, page, pageSize } = filters;

  const where = {
    userId,
    ...(taskId ? { taskId } : {}),
    ...(dateFrom ?? dateTo
      ? {
          date: {
            ...(dateFrom ? { gte: dateFrom } : {}),
            ...(dateTo ? { lte: dateTo } : {}),
          },
        }
      : {}),
  };

  const [logs, total, agg] = await Promise.all([
    prisma.workLog.findMany({
      where,
      include: { task: { select: { id: true, title: true } } },
      orderBy: { createdAt: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.workLog.count({ where }),
    prisma.workLog.aggregate({ where, _sum: { timeSpent: true } }),
  ]);

  return {
    logs,
    total,
    totalHours: agg._sum.timeSpent ?? 0,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getWorkLogsByTask(userId: string, taskId: string): Promise<WorkLog[]> {
  return prisma.workLog.findMany({
    where: { userId, taskId },
    orderBy: { date: 'asc' },
  });
}

export async function createWorkLog(
  userId: string,
  data: CreateWorkLogInput,
): Promise<WorkLog | null> {
  const task = await getTaskById(userId, data.taskId);
  if (!task) return null;

  return prisma.workLog.create({
    data: { ...data, userId },
  });
}

/** Eliminates the N+1 pre-flight SELECT by folding auth into the WHERE clause. */
export async function updateWorkLog(
  userId: string,
  workLogId: string,
  data: UpdateWorkLogInput,
): Promise<WorkLog | null> {
  const result = await prisma.workLog.updateMany({
    where: { id: workLogId, userId },
    data,
  });
  if (result.count === 0) return null;
  return prisma.workLog.findFirst({ where: { id: workLogId, userId } });
}

/** Eliminates the N+1 pre-flight SELECT by folding auth into the WHERE clause. */
export async function deleteWorkLog(userId: string, workLogId: string): Promise<boolean> {
  const result = await prisma.workLog.deleteMany({ where: { id: workLogId, userId } });
  return result.count > 0;
}
