import { cancelUserDeletionAction, setUserActiveAction, setUserRoleAction, rejectUserAction, deleteUserAction, setUserModulesAction, setUserEmploymentTypeAction } from './admin';

jest.mock('@/lib/auth/live-session', () => ({ getLiveSession: jest.fn() }));
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('@/lib/db/prisma', () => ({
  prisma: { user: { update: jest.fn(), findUnique: jest.fn() } },
}));
jest.mock('@/lib/services/account-data.service', () => ({
  deleteUserAccount: jest.fn(),
  cancelAccountDeletion: jest.fn(),
  purgeScheduledAccount: jest.fn(),
}));
jest.mock('@/lib/email/notifications', () => ({
  sendAccountApprovedEmail: jest.fn(),
  sendAccountRejectedEmail: jest.fn(),
}));

import { getLiveSession } from '@/lib/auth/live-session';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import { cancelAccountDeletion, deleteUserAccount, purgeScheduledAccount } from '@/lib/services/account-data.service';
import { sendAccountApprovedEmail, sendAccountRejectedEmail } from '@/lib/email/notifications';

const mockGetServerSession = getLiveSession as jest.MockedFunction<typeof getLiveSession>;
const mockUserUpdate = (prisma.user as jest.Mocked<typeof prisma.user>).update;
const mockUserFindUnique = (prisma.user as jest.Mocked<typeof prisma.user>).findUnique;
const mockUserDelete = deleteUserAccount as jest.MockedFunction<typeof deleteUserAccount>;
const mockPurge = purgeScheduledAccount as jest.MockedFunction<typeof purgeScheduledAccount>;
const mockRevalidatePath = revalidatePath as jest.MockedFunction<typeof revalidatePath>;
const mockSendApproved = sendAccountApprovedEmail as jest.MockedFunction<typeof sendAccountApprovedEmail>;
const mockSendRejected = sendAccountRejectedEmail as jest.MockedFunction<typeof sendAccountRejectedEmail>;

const adminId = 'admin-1';
const targetId = 'user-2';
const adminSession = { userId: adminId, role: 'ADMIN', isActive: true };
const memberSession = { userId: 'member-1', role: 'MEMBER', isActive: true };
const targetUser = { email: 'target@example.com', name: 'Target User' };

beforeEach(() => {
  jest.clearAllMocks();
  mockUserUpdate.mockResolvedValue({} as never);
  mockUserFindUnique.mockResolvedValue(targetUser as never);
  mockUserDelete.mockResolvedValue({} as never);
  mockSendApproved.mockResolvedValue(undefined);
  mockSendRejected.mockResolvedValue(undefined);
});

// ─── setUserActiveAction ──────────────────────────────────────────────────────

describe('setUserActiveAction', () => {
  it('returns Unauthorized when no session', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const result = await setUserActiveAction(targetId, true);
    expect(result).toEqual({ success: false, error: 'Unauthorized.' });
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });

  it('returns Unauthorized when session role is not ADMIN', async () => {
    mockGetServerSession.mockResolvedValue(memberSession as never);
    const result = await setUserActiveAction(targetId, true);
    expect(result).toEqual({ success: false, error: 'Unauthorized.' });
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });

  it('returns error when admin targets their own account', async () => {
    mockGetServerSession.mockResolvedValue(adminSession as never);
    const result = await setUserActiveAction(adminId, false);
    expect(result).toEqual({ success: false, error: 'Cannot change your own active status.' });
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });

  it('activates a user, clears rejectedAt, sends approval email, and revalidates', async () => {
    mockGetServerSession.mockResolvedValue(adminSession as never);
    const result = await setUserActiveAction(targetId, true);
    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { id: targetId },
      data: { isActive: true, rejectedAt: null },
    });
    expect(mockSendApproved).toHaveBeenCalledWith(targetUser.email, targetUser.name);
    expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/users');
    expect(result).toEqual({ success: true });
  });

  it('deactivates a user without sending email', async () => {
    mockGetServerSession.mockResolvedValue(adminSession as never);
    const result = await setUserActiveAction(targetId, false);
    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { id: targetId },
      data: { isActive: false },
    });
    expect(mockSendApproved).not.toHaveBeenCalled();
    expect(result).toEqual({ success: true });
  });

  it('still returns success if approval email fails', async () => {
    mockGetServerSession.mockResolvedValue(adminSession as never);
    mockSendApproved.mockRejectedValue(new Error('SMTP error'));
    const result = await setUserActiveAction(targetId, true);
    expect(result).toEqual({ success: true });
  });
});

// ─── rejectUserAction ─────────────────────────────────────────────────────────

describe('rejectUserAction', () => {
  it('returns Unauthorized when no session', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const result = await rejectUserAction(targetId);
    expect(result).toEqual({ success: false, error: 'Unauthorized.' });
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });

  it('returns Unauthorized when session role is not ADMIN', async () => {
    mockGetServerSession.mockResolvedValue(memberSession as never);
    const result = await rejectUserAction(targetId);
    expect(result).toEqual({ success: false, error: 'Unauthorized.' });
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });

  it('returns error when admin tries to reject their own account', async () => {
    mockGetServerSession.mockResolvedValue(adminSession as never);
    const result = await rejectUserAction(adminId);
    expect(result).toEqual({ success: false, error: 'Cannot reject your own account.' });
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });

  it('sets rejectedAt, sends rejection email, and revalidates', async () => {
    mockGetServerSession.mockResolvedValue(adminSession as never);
    const result = await rejectUserAction(targetId);
    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { id: targetId },
      data: { isActive: false, rejectedAt: expect.any(Date) },
    });
    expect(mockSendRejected).toHaveBeenCalledWith(targetUser.email, targetUser.name);
    expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/users');
    expect(result).toEqual({ success: true });
  });

  it('still returns success if rejection email fails', async () => {
    mockGetServerSession.mockResolvedValue(adminSession as never);
    mockSendRejected.mockRejectedValue(new Error('SMTP error'));
    const result = await rejectUserAction(targetId);
    expect(result).toEqual({ success: true });
  });
});

// ─── deleteUserAction ─────────────────────────────────────────────────────────

describe('deleteUserAction', () => {
  it('returns Unauthorized when no session', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const result = await deleteUserAction(targetId);
    expect(result).toEqual({ success: false, error: 'Unauthorized.' });
    expect(mockUserDelete).not.toHaveBeenCalled();
  });

  it('returns Unauthorized when session role is not ADMIN', async () => {
    mockGetServerSession.mockResolvedValue(memberSession as never);
    const result = await deleteUserAction(targetId);
    expect(result).toEqual({ success: false, error: 'Unauthorized.' });
    expect(mockUserDelete).not.toHaveBeenCalled();
  });

  it('returns error when admin tries to delete their own account', async () => {
    mockGetServerSession.mockResolvedValue(adminSession as never);
    const result = await deleteUserAction(adminId);
    expect(result).toEqual({ success: false, error: 'Cannot delete your own account.' });
    expect(mockUserDelete).not.toHaveBeenCalled();
  });

  it('deletes the user and revalidates the path', async () => {
    mockGetServerSession.mockResolvedValue(adminSession as never);
    mockUserDelete.mockResolvedValue({ ok: true });
    const result = await deleteUserAction(targetId);
    expect(mockUserDelete).toHaveBeenCalledWith(targetId, adminId);
    expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/users');
    expect(result).toEqual({ success: true });
  });

  it('maps LAST_ADMIN to the user-facing message', async () => {
    mockGetServerSession.mockResolvedValue(adminSession as never);
    mockUserDelete.mockResolvedValue({ ok: false, reason: 'LAST_ADMIN' });
    const result = await deleteUserAction(targetId);
    expect(result).toEqual({
      success: false,
      error: 'You are the only administrator. Promote another user to Admin first.',
    });
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it('reports a missing user', async () => {
    mockGetServerSession.mockResolvedValue(adminSession as never);
    mockUserDelete.mockResolvedValue({ ok: false, reason: 'NOT_FOUND' });
    const result = await deleteUserAction(targetId);
    expect(result).toEqual({ success: false, error: 'User not found.' });
  });
});

// ─── setUserModulesAction ─────────────────────────────────────────────────────

describe('setUserModulesAction', () => {
  it('returns Unauthorized when no session', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const result = await setUserModulesAction(targetId, true, true);
    expect(result).toEqual({ success: false, error: 'Unauthorized.' });
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });

  it('returns Unauthorized when session role is not ADMIN', async () => {
    mockGetServerSession.mockResolvedValue(memberSession as never);
    const result = await setUserModulesAction(targetId, true, false);
    expect(result).toEqual({ success: false, error: 'Unauthorized.' });
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });

  it('returns error when admin targets their own account', async () => {
    mockGetServerSession.mockResolvedValue(adminSession as never);
    const result = await setUserModulesAction(adminId, true, true);
    expect(result).toEqual({ success: false, error: 'Cannot remove your own module access.' });
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });

  it('updates moduleWork and moduleFinance and revalidates', async () => {
    mockGetServerSession.mockResolvedValue(adminSession as never);
    const result = await setUserModulesAction(targetId, false, true);
    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { id: targetId },
      data: { moduleWork: false, moduleFinance: true },
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/users');
    expect(result).toEqual({ success: true });
  });
});

// ─── setUserEmploymentTypeAction ──────────────────────────────────────────────

describe('setUserEmploymentTypeAction', () => {
  it('returns Unauthorized when no session', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const result = await setUserEmploymentTypeAction(targetId, 'EMPLOYED');
    expect(result).toEqual({ success: false, error: 'Unauthorized.' });
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });

  it('returns Unauthorized when session role is not ADMIN', async () => {
    mockGetServerSession.mockResolvedValue(memberSession as never);
    const result = await setUserEmploymentTypeAction(targetId, 'SOLE_TRADER');
    expect(result).toEqual({ success: false, error: 'Unauthorized.' });
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });

  it.each([['EMPLOYED'], ['SOLE_TRADER'], ['BOTH']] as const)(
    'sets employmentType to %s and revalidates',
    async (employmentType) => {
      mockGetServerSession.mockResolvedValue(adminSession as never);
      const result = await setUserEmploymentTypeAction(targetId, employmentType);
      expect(mockUserUpdate).toHaveBeenCalledWith({
        where: { id: targetId },
        data: { employmentType },
      });
      expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/users');
      expect(result).toEqual({ success: true });
    },
  );
});

// ─── setUserRoleAction ────────────────────────────────────────────────────────

describe('setUserRoleAction', () => {
  it('returns Unauthorized when no session', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const result = await setUserRoleAction(targetId, 'MEMBER');
    expect(result).toEqual({ success: false, error: 'Unauthorized.' });
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });

  it('returns Unauthorized when session role is not ADMIN', async () => {
    mockGetServerSession.mockResolvedValue(memberSession as never);
    const result = await setUserRoleAction(targetId, 'MANAGER');
    expect(result).toEqual({ success: false, error: 'Unauthorized.' });
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });

  it('returns error when admin targets their own account', async () => {
    mockGetServerSession.mockResolvedValue(adminSession as never);
    const result = await setUserRoleAction(adminId, 'MEMBER');
    expect(result).toEqual({ success: false, error: 'Cannot change your own role.' });
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });

  it.each([['ADMIN'], ['MANAGER'], ['MEMBER']] as const)(
    'sets role to %s and revalidates the path',
    async (role) => {
      mockGetServerSession.mockResolvedValue(adminSession as never);
      const result = await setUserRoleAction(targetId, role);
      expect(mockUserUpdate).toHaveBeenCalledWith({
        where: { id: targetId },
        data: { role },
      });
      expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/users');
      expect(result).toEqual({ success: true });
    },
  );
});

// ─── deletion pending (ADR-010) ───────────────────────────────────────────────

describe('requireAdmin is database-backed', () => {
  it('rejects when the live session is null (e.g. stale ADMIN JWT with a pending DB row)', async () => {
    mockGetServerSession.mockResolvedValue(null);
    await expect(setUserRoleAction(targetId, 'ADMIN')).resolves.toEqual({ success: false, error: 'Unauthorized.' });
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });

  it('rejects an inactive admin', async () => {
    mockGetServerSession.mockResolvedValue({ ...adminSession, isActive: false });
    await expect(setUserRoleAction(targetId, 'ADMIN')).resolves.toEqual({ success: false, error: 'Unauthorized.' });
  });
});

describe('actions on a user pending deletion', () => {
  const pending = { ...targetUser, deletionRequestedAt: new Date('2026-10-01T00:00:00.000Z') };
  const CANCEL_FIRST = { success: false, error: 'Cancel the deletion first.' };

  beforeEach(() => {
    mockGetServerSession.mockResolvedValue(adminSession);
    mockUserFindUnique.mockResolvedValue(pending as never);
  });

  it.each([
    ['approve', () => setUserActiveAction(targetId, true)],
    ['deactivate', () => setUserActiveAction(targetId, false)],
    ['reject', () => rejectUserAction(targetId)],
    ['role', () => setUserRoleAction(targetId, 'ADMIN')],
    ['modules', () => setUserModulesAction(targetId, true, true)],
    ['employment', () => setUserEmploymentTypeAction(targetId, 'EMPLOYED')],
  ])('refuses %s with no write and no email', async (_name, run) => {
    await expect(run()).resolves.toEqual(CANCEL_FIRST);
    expect(mockUserUpdate).not.toHaveBeenCalled();
    expect(mockSendApproved).not.toHaveBeenCalled();
    expect(mockSendRejected).not.toHaveBeenCalled();
  });

  describe('Delete', () => {
    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(new Date('2026-10-11T00:00:00.000Z'));
    });
    afterEach(() => jest.useRealTimers());

    it('purges through the guarded service with a now - 14 days cutoff, never the immediate delete', async () => {
      mockPurge.mockResolvedValue({ ok: true });
      await expect(deleteUserAction(targetId)).resolves.toEqual({ success: true });
      expect(mockPurge).toHaveBeenCalledWith(targetId, new Date('2026-09-27T00:00:00.000Z'), adminId);
      expect(mockUserDelete).not.toHaveBeenCalled();
      expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/users');
    });

    it('explains when the grace period has not passed (Brisbane date of the due instant)', async () => {
      mockPurge.mockResolvedValue({ ok: false, reason: 'NOT_DUE' });
      // 2026-10-01T00:00Z + 14d = 2026-10-15T00:00Z = 15 Oct 10:00 in Brisbane
      await expect(deleteUserAction(targetId)).resolves.toEqual({
        success: false,
        error: 'This account can be deleted from 15 October 2026.',
      });
      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });

    it('keeps the LAST_ADMIN message', async () => {
      mockPurge.mockResolvedValue({ ok: false, reason: 'LAST_ADMIN' });
      await expect(deleteUserAction(targetId)).resolves.toEqual({
        success: false,
        error: 'You are the only administrator. Promote another user to Admin first.',
      });
    });
  });
});

describe('cancelUserDeletionAction', () => {
  const mockCancel = cancelAccountDeletion as jest.Mock;

  it('requires an admin', async () => {
    mockGetServerSession.mockResolvedValue(memberSession);
    await expect(cancelUserDeletionAction(targetId)).resolves.toEqual({ success: false, error: 'Unauthorized.' });
    expect(mockCancel).not.toHaveBeenCalled();
  });

  it('blocks self-targeting', async () => {
    mockGetServerSession.mockResolvedValue(adminSession);
    const result = await cancelUserDeletionAction(adminId);
    expect(result.success).toBe(false);
    expect(mockCancel).not.toHaveBeenCalled();
  });

  it('reports when no deletion is scheduled', async () => {
    mockGetServerSession.mockResolvedValue(adminSession);
    mockCancel.mockResolvedValue(false);
    await expect(cancelUserDeletionAction(targetId)).resolves.toEqual({
      success: false,
      error: 'Deletion is not scheduled.',
    });
  });

  it('cancels and revalidates', async () => {
    mockGetServerSession.mockResolvedValue(adminSession);
    mockCancel.mockResolvedValue(true);
    await expect(cancelUserDeletionAction(targetId)).resolves.toEqual({ success: true });
    expect(mockCancel).toHaveBeenCalledWith(targetId);
    expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/users');
  });
});
