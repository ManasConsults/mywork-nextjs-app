'use server';

import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { LEGAL_VERSION } from '@/lib/legal/constants';
import logger from '@/lib/utils/logger';

type ConsentActionResult =
  | { success: true; data: undefined }
  | { success: false; error: { message: string } };

export async function acceptTermsAction(): Promise<ConsentActionResult> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return { success: false, error: { message: 'You must be signed in.' } };

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { termsAcceptedAt: new Date(), termsVersion: LEGAL_VERSION },
    });
    return { success: true, data: undefined };
  } catch (err) {
    logger.error({ userId, err: err instanceof Error ? err.name : 'unknown' }, 'recording terms acceptance failed');
    return { success: false, error: { message: 'Could not record your acceptance. Please try again.' } };
  }
}
