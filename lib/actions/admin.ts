'use server';

import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import type { Role, EmploymentType } from '@prisma/client';

import { authOptions } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import {
  sendAccountApprovedEmail,
  sendAccountRejectedEmail,
} from '@/lib/email/notifications';

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

  if (isActive) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: true, rejectedAt: null },
    });
    if (user) {
      try { await sendAccountApprovedEmail(user.email, user.name); } catch { /* email failure is non-fatal */ }
    }
  } else {
    await prisma.user.update({ where: { id: userId }, data: { isActive: false } });
  }

  revalidatePath('/admin/users');
  return { success: true };
}

export async function rejectUserAction(userId: string): Promise<AdminActionResult> {
  const adminId = await requireAdmin();
  if (!adminId) return { success: false, error: 'Unauthorized.' };
  if (userId === adminId) return { success: false, error: 'Cannot reject your own account.' };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { isActive: false, rejectedAt: new Date() },
  });

  if (user) {
    try { await sendAccountRejectedEmail(user.email, user.name); } catch { /* email failure is non-fatal */ }
  }

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

export async function deleteUserAction(userId: string): Promise<AdminActionResult> {
  const adminId = await requireAdmin();
  if (!adminId) return { success: false, error: 'Unauthorized.' };
  if (userId === adminId) return { success: false, error: 'Cannot delete your own account.' };

  await prisma.user.delete({ where: { id: userId } });
  revalidatePath('/admin/users');
  return { success: true };
}

export async function setUserModulesAction(
  userId: string,
  moduleWork: boolean,
  moduleFinance: boolean,
): Promise<AdminActionResult> {
  const adminId = await requireAdmin();
  if (!adminId) return { success: false, error: 'Unauthorized.' };
  if (userId === adminId) return { success: false, error: 'Cannot remove your own module access.' };

  await prisma.user.update({ where: { id: userId }, data: { moduleWork, moduleFinance } });
  revalidatePath('/admin/users');
  return { success: true };
}

export async function setUserEmploymentTypeAction(
  userId: string,
  employmentType: EmploymentType,
): Promise<AdminActionResult> {
  const adminId = await requireAdmin();
  if (!adminId) return { success: false, error: 'Unauthorized.' };

  await prisma.user.update({ where: { id: userId }, data: { employmentType } });
  revalidatePath('/admin/users');
  return { success: true };
}
