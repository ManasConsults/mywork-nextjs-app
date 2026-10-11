'use server';

import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth/auth';
import { verifyPassword } from '@/lib/auth/passwords';
import { prisma } from '@/lib/db/prisma';
import { deleteAccountSchema } from '@/lib/schemas/account.schema';
import type { DeleteAccountInput } from '@/lib/schemas/account.schema';
import { sendAccountDeletionRequestedEmail } from '@/lib/email/notifications';
import { computeDeletionDueAt, toBrisbaneIsoDate } from '@/lib/legal/deletion';
import { requestAccountDeletion } from '@/lib/services/account-data.service';
import logger from '@/lib/utils/logger';

type AccountActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string; fields?: Record<string, string[]> } };

const MISMATCH_MESSAGE = 'Confirmation did not match';
const LAST_ADMIN_MESSAGE = 'You are the only administrator. Promote another user to Admin first.';

export async function deleteAccountAction(input: DeleteAccountInput): Promise<AccountActionResult<{ purgeDate: string }>> {
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
    const result = await requestAccountDeletion(userId, new Date());
    if (!result.ok) {
      return {
        success: false,
        error: { message: result.reason === 'LAST_ADMIN' ? LAST_ADMIN_MESSAGE : 'Account not found.' },
      };
    }

    const purgeDate = toBrisbaneIsoDate(computeDeletionDueAt(result.requestedAt));
    if (result.created) {
      logger.warn({ userId }, 'account deletion requested');
      await sendAccountDeletionRequestedEmail({ userId, requestedAt: result.requestedAt, purgeDate });
    }
    return { success: true, data: { purgeDate } };
  } catch (err) {
    logger.error({ userId, err: err instanceof Error ? err.name : 'unknown' }, 'account deletion request failed');
    return { success: false, error: { message: 'Could not request deletion of your account. Please try again.' } };
  }
}
