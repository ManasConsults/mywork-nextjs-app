/** @jest-environment node */
import type { Account, User } from 'next-auth';

import { authOptions } from './auth';

jest.mock('@/lib/db/prisma', () => ({
  prisma: { user: { findUnique: jest.fn(), update: jest.fn(), create: jest.fn() } },
}));
jest.mock('@/lib/auth/passwords', () => ({ verifyPassword: jest.fn() }));
jest.mock('@/lib/email/notifications', () => ({ sendRegistrationPendingEmail: jest.fn() }));

import { prisma } from '@/lib/db/prisma';
import { verifyPassword } from '@/lib/auth/passwords';

const mockFind = prisma.user.findUnique as jest.Mock;
const mockUpdate = prisma.user.update as jest.Mock;
const mockVerify = verifyPassword as jest.Mock;

type Authorize = (credentials: Record<string, string>) => Promise<unknown>;
const provider = authOptions.providers[0] as unknown as { options: { authorize: Authorize } };
const authorize: Authorize = provider.options.authorize;

const baseUser = {
  id: 'u1',
  email: 'jane@example.com',
  name: 'Jane',
  image: null,
  role: 'MEMBER',
  isActive: true,
  passwordHash: 'hash',
  moduleWork: true,
  moduleFinance: true,
  employmentType: 'EMPLOYED',
  currency: 'AUD',
  deletionRequestedAt: null as Date | null,
};
const CREDS = { email: 'jane@example.com', password: 'Password1' };

beforeEach(() => {
  jest.clearAllMocks();
  mockFind.mockResolvedValue(baseUser);
  mockVerify.mockResolvedValue(true);
});

describe('credentials authorize with deletion pending', () => {
  const pending = { ...baseUser, deletionRequestedAt: new Date('2026-10-11T03:00:00.000Z') };

  it('throws the dated code only after the correct password', async () => {
    mockFind.mockResolvedValue(pending);
    await expect(authorize(CREDS)).rejects.toThrow('DELETION_PENDING:2026-10-25');
  });

  it('returns null (generic) for a wrong password', async () => {
    mockFind.mockResolvedValue(pending);
    mockVerify.mockResolvedValue(false);
    await expect(authorize(CREDS)).resolves.toBeNull();
  });

  it('returns null for an inactive pending user without checking the password', async () => {
    mockFind.mockResolvedValue({ ...pending, isActive: false });
    await expect(authorize(CREDS)).resolves.toBeNull();
    expect(mockVerify).not.toHaveBeenCalled();
  });

  it('still signs in a user who is not pending', async () => {
    await expect(authorize(CREDS)).resolves.toMatchObject({ id: 'u1' });
  });
});

describe('OAuth signIn callback with deletion pending', () => {
  const signIn = authOptions.callbacks!.signIn!;
  const oauth = { provider: 'github' } as Account;
  const oauthUser = { id: 'x', email: 'jane@example.com', name: 'New Name', image: 'new.png' } as User;

  it('redirects to /login with the dated error and does not sync the profile', async () => {
    mockFind.mockResolvedValue({ ...baseUser, deletionRequestedAt: new Date('2026-10-11T03:00:00.000Z') });
    const result = await signIn({ user: oauthUser, account: oauth } as Parameters<typeof signIn>[0]);
    expect(result).toBe('/login?error=AccountDeletionPending&deletionDate=2026-10-25');
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('syncs the profile and allows sign-in for a normal active user', async () => {
    const result = await signIn({ user: oauthUser, account: oauth } as Parameters<typeof signIn>[0]);
    expect(result).toBe(true);
    expect(mockUpdate).toHaveBeenCalled();
  });
});

describe('OAuth signIn callback for an unknown email', () => {
  it('creates an inactive user and denies sign-in as before', async () => {
    const signIn = authOptions.callbacks!.signIn!;
    mockFind.mockResolvedValue(null);
    const create = prisma.user.create as jest.Mock;
    create.mockResolvedValue({ ...baseUser, isActive: false });

    const result = await signIn({
      user: { id: 'x', email: 'new@example.com', name: 'N' } as User,
      account: { provider: 'github' } as Account,
    } as Parameters<typeof signIn>[0]);

    expect(create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ isActive: false }) }));
    expect(result).not.toBe(true);
  });
});
