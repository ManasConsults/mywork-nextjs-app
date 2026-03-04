'use server';

import { getServerSession } from 'next-auth';
import type { Achievement } from '@prisma/client';

import { authOptions } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { createAchievementSchema, updateAchievementSchema } from '@/lib/schemas/achievement.schema';
import type { CreateAchievementInput, UpdateAchievementInput } from '@/lib/schemas/achievement.schema';
import {
  createAchievement,
  updateAchievement,
  softDeleteAchievement,
} from '@/lib/services/achievement.service';

type AchievementActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string; fields?: Record<string, string[]> } };

async function getAuthUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

export async function createAchievementAction(
  input: CreateAchievementInput,
): Promise<AchievementActionResult<Achievement>> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { success: false, error: { message: 'You must be signed in.' } };
  }

  const parsed = createAchievementSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        message: 'Validation failed',
        fields: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      },
    };
  }

  try {
    const achievement = await createAchievement(userId, parsed.data);
    return { success: true, data: achievement };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create achievement.';
    return { success: false, error: { message } };
  }
}

export async function updateAchievementAction(
  id: string,
  input: UpdateAchievementInput,
): Promise<AchievementActionResult<Achievement>> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { success: false, error: { message: 'You must be signed in.' } };
  }

  const parsed = updateAchievementSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        message: 'Validation failed',
        fields: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      },
    };
  }

  try {
    const achievement = await updateAchievement(userId, id, parsed.data);
    if (!achievement) {
      return { success: false, error: { message: 'Achievement not found.' } };
    }
    return { success: true, data: achievement };
  } catch {
    return { success: false, error: { message: 'Failed to update achievement.' } };
  }
}

export async function deleteAchievementAction(
  id: string,
): Promise<AchievementActionResult<void>> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { success: false, error: { message: 'You must be signed in.' } };
  }

  try {
    const deleted = await softDeleteAchievement(userId, id);
    if (!deleted) {
      return { success: false, error: { message: 'Achievement not found.' } };
    }
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: { message: 'Failed to delete achievement.' } };
  }
}

export async function updateFiscalYearSettingAction(
  month: number,
): Promise<AchievementActionResult<void>> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { success: false, error: { message: 'You must be signed in.' } };
  }

  if (month < 1 || month > 12) {
    return { success: false, error: { message: 'Month must be between 1 and 12.' } };
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { fiscalYearStartMonth: month },
    });
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: { message: 'Failed to update fiscal year setting.' } };
  }
}
