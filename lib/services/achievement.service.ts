import type { Achievement } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';
import { getTaskById } from '@/lib/services/task.service';
import type { CreateAchievementInput, UpdateAchievementInput, AchievementFilters } from '@/lib/schemas/achievement.schema';
import { achievementFiltersSchema } from '@/lib/schemas/achievement.schema';
import { getFiscalYearRange } from '@/lib/utils/fiscal-year';

export type AchievementWithTask = Achievement & {
  task: { id: string; title: string } | null;
};

export interface PagedAchievements {
  achievements: AchievementWithTask[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function getAchievementsByUser(
  userId: string,
  filters: AchievementFilters = achievementFiltersSchema.parse({}),
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

export async function getAchievementsByUserPaged(
  userId: string,
  filters: AchievementFilters,
  fiscalYearStartMonth = 4,
): Promise<PagedAchievements> {
  const { category, reviewYear, sortBy, sortOrder, page, pageSize } = filters;

  const fyRange = reviewYear
    ? getFiscalYearRange(reviewYear, fiscalYearStartMonth)
    : undefined;

  const where = {
    userId,
    deletedAt: null,
    ...(category ? { category } : {}),
    ...(fyRange ? { dateAchieved: { gte: fyRange.from, lte: fyRange.to } } : {}),
  };

  const [achievements, total] = await Promise.all([
    prisma.achievement.findMany({
      where,
      include: { task: { select: { id: true, title: true } } },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.achievement.count({ where }),
  ]);

  return {
    achievements,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
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

/** Eliminates the N+1 pre-flight SELECT by folding auth into the WHERE clause. */
export async function updateAchievement(
  userId: string,
  id: string,
  data: UpdateAchievementInput,
): Promise<Achievement | null> {
  const result = await prisma.achievement.updateMany({
    where: { id, userId, deletedAt: null },
    data,
  });
  if (result.count === 0) return null;
  return prisma.achievement.findFirst({ where: { id, userId } });
}

/** Eliminates the N+1 pre-flight SELECT by folding auth into the WHERE clause. */
export async function softDeleteAchievement(userId: string, id: string): Promise<boolean> {
  const result = await prisma.achievement.updateMany({
    where: { id, userId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return result.count > 0;
}
