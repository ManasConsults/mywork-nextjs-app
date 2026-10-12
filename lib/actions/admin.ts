'use server';

import { revalidatePath } from 'next/cache';
import type { Role, EmploymentType } from '@prisma/client';

import { getLiveSession } from '@/lib/auth/live-session';
import { prisma } from '@/lib/db/prisma';
import {
  ACCOUNT_DELETION_GRACE_MS,
  computeDeletionDueAt,
  formatDeletionDate,
  toBrisbaneIsoDate,
} from '@/lib/legal/deletion';
import {
  cancelAccountDeletion,
  deleteUserAccount,
  purgeScheduledAccount,
} from '@/lib/services/account-data.service';
import {
  sendAccountApprovedEmail,
  sendAccountRejectedEmail,
} from '@/lib/email/notifications';
import logger from '@/lib/utils/logger';

type AdminActionResult = { success: true } | { success: false; error: string };

// Role comes from the database, not the JWT, so a demoted or pending-deletion admin loses access immediately.
async function requireAdmin(): Promise<string | null> {
  const live = await getLiveSession();
  if (!live || live.role !== 'ADMIN' || !live.isActive) return null;
  return live.userId;
}

const CANCEL_FIRST_ERROR = 'Cancel the deletion first.';

async function getDeletionRequestedAt(userId: string): Promise<Date | null> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { deletionRequestedAt: true } });
  return user?.deletionRequestedAt ?? null;
}

async function isDeletionPending(userId: string): Promise<boolean> {
  return (await getDeletionRequestedAt(userId)) !== null;
}

export async function setUserActiveAction(
  userId: string,
  isActive: boolean,
): Promise<AdminActionResult> {
  const adminId = await requireAdmin();
  if (!adminId) return { success: false, error: 'Unauthorized.' };
  if (userId === adminId) return { success: false, error: 'Cannot change your own active status.' };
  if (await isDeletionPending(userId)) return { success: false, error: CANCEL_FIRST_ERROR };

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
  if (await isDeletionPending(userId)) return { success: false, error: CANCEL_FIRST_ERROR };

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
  if (await isDeletionPending(userId)) return { success: false, error: CANCEL_FIRST_ERROR };

  await prisma.user.update({ where: { id: userId }, data: { role } });
  revalidatePath('/admin/users');
  return { success: true };
}

export async function deleteUserAction(userId: string): Promise<AdminActionResult> {
  const adminId = await requireAdmin();
  if (!adminId) return { success: false, error: 'Unauthorized.' };
  if (userId === adminId) return { success: false, error: 'Cannot delete your own account.' };

  const requestedAt = await getDeletionRequestedAt(userId);
  // A pending account may only be erased once its grace period has passed; the service re-checks under the row lock.
  const result = requestedAt
    ? await purgeScheduledAccount(userId, new Date(Date.now() - ACCOUNT_DELETION_GRACE_MS), adminId)
    : await deleteUserAccount(userId, adminId);
  if (!result.ok) {
    if (result.reason === 'NOT_DUE' && requestedAt) {
      const dueDate = formatDeletionDate(toBrisbaneIsoDate(computeDeletionDueAt(requestedAt)));
      return { success: false, error: `This account can be deleted from ${dueDate}.` };
    }
    return {
      success: false,
      error: result.reason === 'LAST_ADMIN'
        ? 'You are the only administrator. Promote another user to Admin first.'
        : 'User not found.',
    };
  }
  revalidatePath('/admin/users');
  return { success: true };
}

export async function cancelUserDeletionAction(userId: string): Promise<AdminActionResult> {
  const adminId = await requireAdmin();
  if (!adminId) return { success: false, error: 'Unauthorized.' };
  if (userId === adminId) return { success: false, error: 'Cannot cancel your own deletion.' };

  if (!(await cancelAccountDeletion(userId))) return { success: false, error: 'Deletion is not scheduled.' };

  logger.warn({ userId, actorId: adminId }, 'account deletion cancelled');
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
  if (await isDeletionPending(userId)) return { success: false, error: CANCEL_FIRST_ERROR };

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
  if (await isDeletionPending(userId)) return { success: false, error: CANCEL_FIRST_ERROR };

  await prisma.user.update({ where: { id: userId }, data: { employmentType } });
  revalidatePath('/admin/users');
  return { success: true };
}
