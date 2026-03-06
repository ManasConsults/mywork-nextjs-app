import type { User, EmploymentType } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';
import { hashPassword, verifyPassword } from '@/lib/auth/passwords';
import type { UpdateProfileInput, UpdateSettingsInput } from '@/lib/schemas/profile.schema';

export async function getUserById(id: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id } });
}

export async function updateProfile(
  userId: string,
  data: UpdateProfileInput,
): Promise<User> {
  return prisma.user.update({
    where: { id: userId },
    data: {
      name: data.name ?? null,
      image: data.image || null,
    },
  });
}

export async function updateSettings(
  userId: string,
  data: UpdateSettingsInput,
): Promise<User> {
  return prisma.user.update({
    where: { id: userId },
    data: { fiscalYearStartMonth: data.fiscalYearStartMonth },
  });
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<{ success: boolean; error?: string }> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { success: false, error: 'User not found.' };

  if (!user.passwordHash) {
    return { success: false, error: 'Password change is not available for OAuth accounts.' };
  }

  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) return { success: false, error: 'Current password is incorrect.' };

  const newHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newHash },
  });

  return { success: true };
}

export async function updateEmploymentType(
  userId: string,
  employmentType: EmploymentType,
): Promise<User> {
  return prisma.user.update({ where: { id: userId }, data: { employmentType } });
}
