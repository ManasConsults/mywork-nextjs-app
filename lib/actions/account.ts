'use server';

import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth/auth';
import { verifyPassword } from '@/lib/auth/passwords';
import { prisma } from '@/lib/db/prisma';
import { deleteAccountSchema } from '@/lib/schemas/account.schema';
import type { DeleteAccountInput } from '@/lib/schemas/account.schema';
import { deleteUserAccount } from '@/lib/services/account-data.service';
import logger from '@/lib/utils/logger';

type AccountActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string; fields?: Record<string, string[]> } };

const MISMATCH_MESSAGE = 'Confirmation did not match';
const LAST_ADMIN_MESSAGE = 'You are the only administrator. Promote another user to Admin first.';

export async function deleteAccountAction(input: DeleteAccountInput): Promise<AccountActionResult<void>> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return { success: false, error: { message: 'You must be signed in.' } };

  const parsed = deleteAccountSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: { message: 'Validation failed.', fields: parsed.error.flatten().fieldErrors },
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, passwordHash: true },
  });
  if (!user) return { success: false, error: { message: 'Account not found.' } };

  const { confirmation } = parsed.data;
  const confirmed = user.passwordHash
    ? await verifyPassword(confirmation, user.passwordHash)
    : confirmation.trim().toLowerCase() === user.email.toLowerCase();
  if (!confirmed) {
    return { success: false, error: { message: MISMATCH_MESSAGE, fields: { confirmation: [MISMATCH_MESSAGE] } } };
  }

  try {
    const result = await deleteUserAccount(userId, userId);
    if (!result.ok) {
      return {
        success: false,
        error: { message: result.reason === 'LAST_ADMIN' ? LAST_ADMIN_MESSAGE : 'Account not found.' },
      };
    }
    return { success: true, data: undefined };
  } catch (err) {
    logger.error({ userId, err: err instanceof Error ? err.name : 'unknown' }, 'self-service account deletion failed');
    return { success: false, error: { message: 'Could not delete your account. Please try again.' } };
  }
}
