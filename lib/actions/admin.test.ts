import { setUserActiveAction, setUserRoleAction, rejectUserAction, deleteUserAction, setUserModulesAction, setUserEmploymentTypeAction } from './admin';

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth/auth', () => ({ authOptions: {} }));
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('@/lib/db/prisma', () => ({
  prisma: { user: { update: jest.fn(), findUnique: jest.fn(), delete: jest.fn() } },
}));
jest.mock('@/lib/email/notifications', () => ({
  sendAccountApprovedEmail: jest.fn(),
  sendAccountRejectedEmail: jest.fn(),
}));

import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import { sendAccountApprovedEmail, sendAccountRejectedEmail } from '@/lib/email/notifications';

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockUserUpdate = (prisma.user as jest.Mocked<typeof prisma.user>).update;
const mockUserFindUnique = (prisma.user as jest.Mocked<typeof prisma.user>).findUnique;
const mockUserDelete = (prisma.user as jest.Mocked<typeof prisma.user>).delete;
const mockRevalidatePath = revalidatePath as jest.MockedFunction<typeof revalidatePath>;
const mockSendApproved = sendAccountApprovedEmail as jest.MockedFunction<typeof sendAccountApprovedEmail>;
const mockSendRejected = sendAccountRejectedEmail as jest.MockedFunction<typeof sendAccountRejectedEmail>;

const adminId = 'admin-1';
const targetId = 'user-2';
const adminSession = { user: { id: adminId, role: 'ADMIN' }, expires: '' };
const memberSession = { user: { id: 'member-1', role: 'MEMBER' }, expires: '' };
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
    const result = await deleteUserAction(targetId);
    expect(mockUserDelete).toHaveBeenCalledWith({ where: { id: targetId } });
    expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/users');
    expect(result).toEqual({ success: true });
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
