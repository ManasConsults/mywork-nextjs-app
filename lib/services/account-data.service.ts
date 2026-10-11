import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/utils/logger';
import { LEGAL_VERSION } from '@/lib/legal/constants';
import { ACCOUNT_DATA_REGISTRY, EXPORT_PAGE_SIZE } from './account-data.registry';

export type DeleteAccountResult =
  | { ok: true }
  | { ok: false; reason: 'LAST_ADMIN' | 'NOT_FOUND' };

interface LockedUserRow {
  id: string;
  role: string;
  isActive: boolean;
}

/**
 * Hard-deletes a user and everything they own in one transaction (ADR-007).
 * Callers are responsible for authorisation; this only guards the last-admin invariant.
 */
export async function deleteUserAccount(userId: string, actorId: string): Promise<DeleteAccountResult> {
  const outcome = await prisma.$transaction(
    async (tx) => {
      // One statement locks the target and every active admin, so two admins deleting
      // each other serialise and the loser re-reads the reduced admin set.
      const rows = await tx.$queryRaw<LockedUserRow[]>`
        SELECT id, role::text AS role, "isActive"
        FROM users
        WHERE id = ${userId} OR (role = 'ADMIN' AND "isActive" = true)
        FOR UPDATE`;

      const target = rows.find((r) => r.id === userId);
      if (!target) return { ok: false, reason: 'NOT_FOUND' } as const;

      const isActiveAdmin = target.role === 'ADMIN' && target.isActive;
      if (isActiveAdmin && !rows.some((r) => r.id !== userId)) {
        return { ok: false, reason: 'LAST_ADMIN' } as const;
      }

      const counts: Record<string, number> = {};
      for (const entry of ACCOUNT_DATA_REGISTRY) {
        counts[entry.model] = await entry.erase(tx, userId);
      }
      await tx.user.delete({ where: { id: userId } });

      return { ok: true, counts } as const;
    },
    { timeout: 15_000, maxWait: 5_000 },
  );

  if (!outcome.ok) return outcome;

  logger.warn({ userId, actorId, counts: outcome.counts }, 'account deleted');
  return { ok: true };
}

/**
 * Yields the export envelope as JSON text fragments, one registry page at a time, so the
 * response never holds more than a page in memory (ADR-009).
 */
export async function* exportAccountChunks(
  userId: string,
  user: Record<string, unknown>,
  exportedAt: Date,
): AsyncGenerator<string> {
  yield `{"exportedAt":${JSON.stringify(exportedAt)},"legalVersion":${JSON.stringify(LEGAL_VERSION)},"user":${JSON.stringify(user)}`;

  for (const entry of ACCOUNT_DATA_REGISTRY) {
    if (!entry.exportKey || !entry.readPage) continue;

    yield `,${JSON.stringify(entry.exportKey)}:[`;
    let afterId: string | null = null;
    let isFirst = true;
    for (;;) {
      const page = await entry.readPage(userId, afterId, EXPORT_PAGE_SIZE);
      if (page.length > 0) {
        yield (isFirst ? '' : ',') + page.map((row) => JSON.stringify(row)).join(',');
        isFirst = false;
        afterId = page[page.length - 1].id;
      }
      if (page.length < EXPORT_PAGE_SIZE) break;
    }
    yield ']';
  }

  yield '}';
}
