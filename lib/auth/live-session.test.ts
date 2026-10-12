/** @jest-environment node */
import { getLiveSession } from './live-session';

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth/auth', () => ({ authOptions: {} }));
jest.mock('@/lib/db/prisma', () => ({ prisma: { user: { findUnique: jest.fn() } } }));

import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db/prisma';

const mockSession = getServerSession as jest.Mock;
const mockFind = prisma.user.findUnique as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockSession.mockResolvedValue({ user: { id: 'u1', role: 'MEMBER' } });
  mockFind.mockResolvedValue({ role: 'ADMIN', isActive: true, deletionRequestedAt: null });
});

describe('getLiveSession', () => {
  it('returns null without a session and skips the DB', async () => {
    mockSession.mockResolvedValue(null);
    await expect(getLiveSession()).resolves.toBeNull();
    expect(mockFind).not.toHaveBeenCalled();
  });

  it('returns null when the user row is gone', async () => {
    mockFind.mockResolvedValue(null);
    await expect(getLiveSession()).resolves.toBeNull();
  });

  it('returns null when deletion is pending', async () => {
    mockFind.mockResolvedValue({ role: 'ADMIN', isActive: true, deletionRequestedAt: new Date() });
    await expect(getLiveSession()).resolves.toBeNull();
  });

  it('takes role and isActive from the database, not the JWT', async () => {
    await expect(getLiveSession()).resolves.toEqual({ userId: 'u1', role: 'ADMIN', isActive: true });
  });
});
