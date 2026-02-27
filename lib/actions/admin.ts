'use server';

import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import type { Role } from '@prisma/client';

import { authOptions } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';

type AdminActionResult = { success: true } | { success: false; error: string };

async function requireAdmin(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user?.id || user.role !== 'ADMIN') return null;
  return user.id;
}

export async function setUserActiveAction(
  userId: string,
  isActive: boolean,
): Promise<AdminActionResult> {
  const adminId = await requireAdmin();
  if (!adminId) return { success: false, error: 'Unauthorized.' };
  if (userId === adminId) return { success: false, error: 'Cannot change your own active status.' };

  await prisma.user.update({ where: { id: userId }, data: { isActive } });
  revalidatePath('/admin/users');
  return { success: true };
}

export async function setUserRoleAction(
  userId: string,
  role: Role,
): Promise<AdminActionResult> {
  const adminId = await requireAdmin();
  if (!adminId) return { success: false, error: 'Unauthorized.' };
  if (userId === adminId) return { success: false, error: 'Cannot change your own role.' };

  await prisma.user.update({ where: { id: userId }, data: { role } });
  revalidatePath('/admin/users');
  return { success: true };
}
