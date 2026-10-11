/** @jest-environment node */
import { deleteAccountAction } from './account';

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth/auth', () => ({ authOptions: {} }));
jest.mock('@/lib/db/prisma', () => ({ prisma: { user: { findUnique: jest.fn() } } }));
jest.mock('@/lib/auth/passwords', () => ({ verifyPassword: jest.fn() }));
jest.mock('@/lib/services/account-data.service', () => ({ deleteUserAccount: jest.fn() }));

import { getServerSession } from 'next-auth';
import { verifyPassword } from '@/lib/auth/passwords';
import { prisma } from '@/lib/db/prisma';
import { deleteUserAccount } from '@/lib/services/account-data.service';

const mockSession = getServerSession as jest.Mock;
const mockFindUnique = prisma.user.findUnique as jest.Mock;
const mockVerify = verifyPassword as jest.Mock;
const mockDelete = deleteUserAccount as jest.Mock;

const INPUT = { confirmation: 'Password1', acknowledged: true as const };

beforeEach(() => {
  jest.clearAllMocks();
  mockSession.mockResolvedValue({ user: { id: 'u1' } });
  mockFindUnique.mockResolvedValue({ email: 'Jane@Example.com', passwordHash: 'hash' });
  mockVerify.mockResolvedValue(true);
  mockDelete.mockResolvedValue({ ok: true });
});

describe('deleteAccountAction', () => {
  it('requires a session', async () => {
    mockSession.mockResolvedValue(null);
    const result = await deleteAccountAction(INPUT);
    expect(result.success).toBe(false);
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('rejects invalid input', async () => {
    const result = await deleteAccountAction({ confirmation: '', acknowledged: true });
    expect(result.success).toBe(false);
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('refuses a wrong password', async () => {
    mockVerify.mockResolvedValue(false);
    const result = await deleteAccountAction(INPUT);
    expect(result).toEqual({
      success: false,
      error: { message: 'Confirmation did not match', fields: { confirmation: ['Confirmation did not match'] } },
    });
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('deletes the signed-in user after a correct password', async () => {
    await expect(deleteAccountAction(INPUT)).resolves.toEqual({ success: true, data: undefined });
    expect(mockDelete).toHaveBeenCalledWith('u1', 'u1');
  });

  it('confirms OAuth-only users by case-insensitive email', async () => {
    mockFindUnique.mockResolvedValue({ email: 'Jane@Example.com', passwordHash: null });
    const result = await deleteAccountAction({ confirmation: ' jane@example.com ', acknowledged: true });
    expect(result.success).toBe(true);
    expect(mockVerify).not.toHaveBeenCalled();
  });

  it('refuses a mismatching email for OAuth-only users', async () => {
    mockFindUnique.mockResolvedValue({ email: 'jane@example.com', passwordHash: null });
    const result = await deleteAccountAction({ confirmation: 'other@example.com', acknowledged: true });
    expect(result.success).toBe(false);
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('maps LAST_ADMIN to the user-facing message', async () => {
    mockDelete.mockResolvedValue({ ok: false, reason: 'LAST_ADMIN' });
    const result = await deleteAccountAction(INPUT);
    expect(result).toEqual({
      success: false,
      error: { message: 'You are the only administrator. Promote another user to Admin first.' },
    });
  });

  it('returns a generic error if erasure throws', async () => {
    mockDelete.mockRejectedValue(new Error('db down'));
    const result = await deleteAccountAction(INPUT);
    expect(result.success).toBe(false);
  });
});

describe('deleteAccountAction (isolation and logging)', () => {
  it('never deletes a user other than the session user, whatever the input contains', async () => {
    await deleteAccountAction({ confirmation: 'Password1', acknowledged: true, userId: 'victim' } as never);
    expect(mockDelete).toHaveBeenCalledTimes(1);
    expect(mockDelete).toHaveBeenCalledWith('u1', 'u1');
  });

  it('does not touch the service when the user row is missing', async () => {
    mockFindUnique.mockResolvedValue(null);
    const result = await deleteAccountAction(INPUT);
    expect(result.success).toBe(false);
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('logs the failure with ids only, never the email, password or error message', async () => {
    const loggerModule = jest.requireActual<typeof import('@/lib/utils/logger')>('@/lib/utils/logger');
    const spy = jest.spyOn(loggerModule.default, 'error');
    mockDelete.mockRejectedValue(new Error('secret Jane@Example.com Password1'));

    await deleteAccountAction(INPUT);

    const [ctx] = spy.mock.calls[0];
    expect(JSON.stringify(ctx)).not.toMatch(/Jane|Password1|example\.com/i);
    expect(Object.keys(ctx).sort()).toEqual(['err', 'userId']);
    spy.mockRestore();
  });
});
