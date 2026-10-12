/** @jest-environment node */
import { acceptTermsAction } from './consent';

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth/auth', () => ({ authOptions: {} }));
jest.mock('@/lib/db/prisma', () => ({ prisma: { user: { update: jest.fn() } } }));

import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db/prisma';
import { LEGAL_VERSION } from '@/lib/legal/constants';

const mockSession = getServerSession as jest.Mock;
const mockUpdate = prisma.user.update as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('acceptTermsAction', () => {
  it('requires a session', async () => {
    mockSession.mockResolvedValue(null);
    const result = await acceptTermsAction();
    expect(result.success).toBe(false);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('records the current version for the signed-in user', async () => {
    mockSession.mockResolvedValue({ user: { id: 'u1' } });
    mockUpdate.mockResolvedValue({});
    await expect(acceptTermsAction()).resolves.toEqual({ success: true, data: undefined });
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { termsAcceptedAt: expect.any(Date), termsVersion: LEGAL_VERSION },
    });
  });

  it('returns an error instead of throwing when the write fails', async () => {
    mockSession.mockResolvedValue({ user: { id: 'u1' } });
    mockUpdate.mockRejectedValue(new Error('db down'));
    const result = await acceptTermsAction();
    expect(result.success).toBe(false);
  });
});

describe('acceptTermsAction (isolation)', () => {
  it('only ever updates the session user', async () => {
    mockSession.mockResolvedValue({ user: { id: 'userA' } });
    mockUpdate.mockResolvedValue({});
    await acceptTermsAction();
    expect(mockUpdate.mock.calls[0][0].where).toEqual({ id: 'userA' });
  });
});
