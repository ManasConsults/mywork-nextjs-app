import { setUserActiveAction, setUserRoleAction } from './admin';

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth/auth', () => ({ authOptions: {} }));
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('@/lib/db/prisma', () => ({
  prisma: { user: { update: jest.fn() } },
}));

import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/prisma';

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockUserUpdate = (prisma.user as jest.Mocked<typeof prisma.user>).update;
const mockRevalidatePath = revalidatePath as jest.MockedFunction<typeof revalidatePath>;

const adminId = 'admin-1';
const targetId = 'user-2';
const adminSession = { user: { id: adminId, role: 'ADMIN' }, expires: '' };
const memberSession = { user: { id: 'member-1', role: 'MEMBER' }, expires: '' };

beforeEach(() => {
  jest.clearAllMocks();
  mockUserUpdate.mockResolvedValue({} as never);
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

  it('activates a user and revalidates the path', async () => {
    mockGetServerSession.mockResolvedValue(adminSession as never);
    const result = await setUserActiveAction(targetId, true);
    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { id: targetId },
      data: { isActive: true },
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/users');
    expect(result).toEqual({ success: true });
  });

  it('deactivates a user and revalidates the path', async () => {
    mockGetServerSession.mockResolvedValue(adminSession as never);
    const result = await setUserActiveAction(targetId, false);
    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { id: targetId },
      data: { isActive: false },
    });
    expect(result).toEqual({ success: true });
  });
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
