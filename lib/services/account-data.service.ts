import type { Prisma } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/utils/logger';
import { LEGAL_VERSION } from '@/lib/legal/constants';
import { ACCOUNT_DATA_REGISTRY, EXPORT_PAGE_SIZE } from './account-data.registry';

export type DeleteAccountResult =
  | { ok: true }
  | { ok: false; reason: 'LAST_ADMIN' | 'NOT_FOUND' };

export type PurgeScheduledResult =
  | { ok: true }
  | { ok: false; reason: 'LAST_ADMIN' | 'NOT_FOUND' | 'NOT_DUE' };

export type RequestDeletionResult =
  | { ok: true; requestedAt: Date; created: boolean }
  | { ok: false; reason: 'LAST_ADMIN' | 'NOT_FOUND' };

interface LockedUserRow {
  id: string;
  role: string;
  isActive: boolean;
  isPending: boolean;
}

type EraseOutcome<Reason extends string> =
  | { ok: true; counts: Record<string, number> }
  | { ok: false; reason: Reason };

const TX_OPTIONS = { timeout: 15_000, maxWait: 5_000 } as const;

interface LockedTarget {
  target: LockedUserRow | undefined;
  isLastEffectiveAdmin: boolean;
}

/**
 * One statement locks the target and every effective admin (active, not pending deletion),
 * so concurrent requests/deletions serialise and the loser re-reads the reduced admin set.
 * ORDER BY id gives every transaction the same lock order, which avoids deadlocks.
 */
async function lockTargetAndAdmins(tx: Prisma.TransactionClient, userId: string): Promise<LockedTarget> {
  const rows = await tx.$queryRaw<LockedUserRow[]>`
    SELECT id, role::text AS role, "isActive", ("deletionRequestedAt" IS NOT NULL) AS "isPending"
    FROM users
    WHERE id = ${userId}
       OR (role = 'ADMIN' AND "isActive" = true AND "deletionRequestedAt" IS NULL)
    ORDER BY id
    FOR UPDATE`;

  const target = rows.find((r) => r.id === userId);
  const targetIsEffectiveAdmin = !!target && target.role === 'ADMIN' && target.isActive && !target.isPending;
  // Rows other than the target are effective admins by construction of the WHERE clause.
  const isLastEffectiveAdmin = targetIsEffectiveAdmin && !rows.some((r) => r.id !== userId);
  return { target, isLastEffectiveAdmin };
}

/**
 * Shared erasure transaction (ADR-007, ADR-010). With a cutoff it only erases a user whose
 * deletion request is still set and due, re-checked under the row lock.
 */
async function eraseAccount(userId: string, cutoff: null): Promise<EraseOutcome<'LAST_ADMIN' | 'NOT_FOUND'>>;
async function eraseAccount(
  userId: string,
  cutoff: Date,
): Promise<EraseOutcome<'LAST_ADMIN' | 'NOT_FOUND' | 'NOT_DUE'>>;
async function eraseAccount(
  userId: string,
  cutoff: Date | null,
): Promise<EraseOutcome<'LAST_ADMIN' | 'NOT_FOUND' | 'NOT_DUE'>> {
  return prisma.$transaction(async (tx): Promise<EraseOutcome<'LAST_ADMIN' | 'NOT_FOUND' | 'NOT_DUE'>> => {
    const { target, isLastEffectiveAdmin } = await lockTargetAndAdmins(tx, userId);
    if (!target) return { ok: false, reason: 'NOT_FOUND' };

    if (cutoff) {
      const due = await tx.user.findFirst({
        where: { id: userId, deletionRequestedAt: { lte: cutoff } },
        select: { id: true },
      });
      if (!due) return { ok: false, reason: 'NOT_DUE' };
    }

    if (isLastEffectiveAdmin) return { ok: false, reason: 'LAST_ADMIN' };

    const counts: Record<string, number> = {};
    for (const entry of ACCOUNT_DATA_REGISTRY) {
      counts[entry.model] = await entry.erase(tx, userId);
    }
    await tx.user.delete({ where: { id: userId } });

    return { ok: true, counts };
  }, TX_OPTIONS);
}

/**
 * Hard-deletes a user and everything they own in one transaction (ADR-007).
 * Callers are responsible for authorisation; this only guards the last-admin invariant.
 */
export async function deleteUserAccount(userId: string, actorId: string): Promise<DeleteAccountResult> {
  const outcome = await eraseAccount(userId, null);
  if (!outcome.ok) return outcome;

  logger.warn({ userId, actorId, counts: outcome.counts }, 'account deleted');
  return { ok: true };
}

/** Erases a user whose grace period has elapsed (admin-initiated); refuses if the request was cancelled or is not yet due. */
export async function purgeScheduledAccount(
  userId: string,
  cutoff: Date,
  actorId: string,
): Promise<PurgeScheduledResult> {
  const outcome = await eraseAccount(userId, cutoff);
  if (!outcome.ok) return outcome;

  logger.warn({ userId, actorId, counts: outcome.counts }, 'account deleted');
  return { ok: true };
}

/** Marks the account for deletion without touching any data; idempotent for an already-pending account. */
export async function requestAccountDeletion(userId: string, now: Date): Promise<RequestDeletionResult> {
  return prisma.$transaction(async (tx): Promise<RequestDeletionResult> => {
    const { target, isLastEffectiveAdmin } = await lockTargetAndAdmins(tx, userId);
    if (!target) return { ok: false, reason: 'NOT_FOUND' };

    if (target.isPending) {
      const existing = await tx.user.findUnique({ where: { id: userId }, select: { deletionRequestedAt: true } });
      if (existing?.deletionRequestedAt) {
        return { ok: true, requestedAt: existing.deletionRequestedAt, created: false };
      }
    }

    if (isLastEffectiveAdmin) return { ok: false, reason: 'LAST_ADMIN' };

    await tx.user.update({ where: { id: userId }, data: { deletionRequestedAt: now } });
    return { ok: true, requestedAt: now, created: true };
  }, TX_OPTIONS);
}

/** No lock needed: cancelling only grows the effective-admin set. Returns false if nothing was pending. */
export async function cancelAccountDeletion(userId: string): Promise<boolean> {
  const { count } = await prisma.user.updateMany({
    where: { id: userId, deletionRequestedAt: { not: null } },
    data: { deletionRequestedAt: null },
  });
  return count > 0;
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
