import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';

export interface LiveSession {
  userId: string;
  role: string;
  isActive: boolean;
}

/**
 * Session re-read from the database: the JWT can be up to 30 days stale, so privileged paths
 * take role/isActive from the row and reject users whose deletion is pending.
 */
export async function getLiveSession(): Promise<LiveSession | null> {
  const session = await getServerSession(authOptions);
  const id = session?.user?.id;
  if (!id) return null;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { role: true, isActive: true, deletionRequestedAt: true },
  });
  if (!user || user.deletionRequestedAt) return null;

  return { userId: id, role: user.role, isActive: user.isActive };
}
