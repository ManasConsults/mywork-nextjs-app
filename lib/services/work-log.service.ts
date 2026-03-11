import type { WorkLog } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';
import { getTaskById } from '@/lib/services/task.service';
import type { CreateWorkLogInput, UpdateWorkLogInput, WorkLogFilters } from '@/lib/schemas/work-log.schema';

export type WorkLogWithTask = WorkLog & { task: { id: string; title: string } | null };

export async function getWorkLogsByUser(
  userId: string,
  filters: WorkLogFilters = {},
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

export async function updateWorkLog(
  userId: string,
  workLogId: string,
  data: UpdateWorkLogInput,
): Promise<WorkLog | null> {
  const existing = await prisma.workLog.findFirst({ where: { id: workLogId, userId } });
  if (!existing) return null;

  return prisma.workLog.update({ where: { id: workLogId }, data });
}

export async function deleteWorkLog(userId: string, workLogId: string): Promise<boolean> {
  const existing = await prisma.workLog.findFirst({ where: { id: workLogId, userId } });
  if (!existing) return false;

  await prisma.workLog.delete({ where: { id: workLogId } });
  return true;
}
