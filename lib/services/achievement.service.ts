import type { Achievement } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';
import { getTaskById } from '@/lib/services/task.service';
import type { CreateAchievementInput, UpdateAchievementInput, AchievementFilters } from '@/lib/schemas/achievement.schema';
import { getFiscalYearRange } from '@/lib/utils/fiscal-year';

export type AchievementWithTask = Achievement & {
  task: { id: string; title: string } | null;
};

export async function getAchievementsByUser(
  userId: string,
  filters: AchievementFilters = {},
  fiscalYearStartMonth = 4,
): Promise<AchievementWithTask[]> {
  const fyRange = filters.reviewYear
    ? getFiscalYearRange(filters.reviewYear, fiscalYearStartMonth)
    : undefined;

  return prisma.achievement.findMany({
    where: {
      userId,
      deletedAt: null,
      ...(filters.category ? { category: filters.category } : {}),
      ...(fyRange
        ? { dateAchieved: { gte: fyRange.from, lte: fyRange.to } }
        : {}),
    },
    include: { task: { select: { id: true, title: true } } },
    orderBy: [{ dateAchieved: 'desc' }, { createdAt: 'desc' }],
  });
}

export async function getAchievementById(
  userId: string,
  id: string,
): Promise<Achievement | null> {
  return prisma.achievement.findFirst({
    where: { id, userId, deletedAt: null },
  });
}

export async function createAchievement(
  userId: string,
  data: CreateAchievementInput,
): Promise<Achievement> {
  // If taskId provided, verify it belongs to this user
  if (data.taskId) {
    const task = await getTaskById(userId, data.taskId);
    if (!task) throw new Error('Task not found or not accessible.');
  }

  return prisma.achievement.create({
    data: { ...data, userId },
  });
}

export async function updateAchievement(
  userId: string,
  id: string,
  data: UpdateAchievementInput,
): Promise<Achievement | null> {
  const existing = await getAchievementById(userId, id);
  if (!existing) return null;

  return prisma.achievement.update({ where: { id }, data });
}

export async function softDeleteAchievement(
  userId: string,
  id: string,
): Promise<boolean> {
  const existing = await getAchievementById(userId, id);
  if (!existing) return false;

  await prisma.achievement.update({ where: { id }, data: { deletedAt: new Date() } });
  return true;
}
