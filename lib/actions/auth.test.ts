import { registerUser, requestPasswordReset, resetPassword } from './auth';

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    passwordResetToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock('@/lib/auth/passwords', () => ({
  hashPassword: jest.fn().mockResolvedValue('hashed-password'),
}));

jest.mock('@/lib/auth/reset-token', () => ({
  generateResetToken: jest.fn().mockReturnValue({
    token: 'raw-token',
    tokenHash: 'hashed-token',
    expiresAt: new Date('2026-01-01T01:00:00.000Z'),
  }),
  hashResetToken: jest.fn().mockReturnValue('hashed-token'),
}));

jest.mock('@/lib/email/notifications', () => ({
  sendRegistrationPendingEmail: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
}));

import { prisma } from '@/lib/db/prisma';
import { sendRegistrationPendingEmail, sendPasswordResetEmail } from '@/lib/email/notifications';

const mockFindUnique = (prisma.user as jest.Mocked<typeof prisma.user>).findUnique;
const mockCreate = (prisma.user as jest.Mocked<typeof prisma.user>).create;
const mockSendPending = sendRegistrationPendingEmail as jest.MockedFunction<typeof sendRegistrationPendingEmail>;
const mockSendReset = sendPasswordResetEmail as jest.MockedFunction<typeof sendPasswordResetEmail>;
const mockTokenCreate = (prisma.passwordResetToken as jest.Mocked<typeof prisma.passwordResetToken>).create;
const mockTokenFindUnique = (prisma.passwordResetToken as jest.Mocked<typeof prisma.passwordResetToken>).findUnique;
const mockTokenUpdate = (prisma.passwordResetToken as jest.Mocked<typeof prisma.passwordResetToken>).update;
const mockTokenUpdateMany = (prisma.passwordResetToken as jest.Mocked<typeof prisma.passwordResetToken>).updateMany;
const mockUserUpdate = (prisma.user as jest.Mocked<typeof prisma.user>).update;
const mockTransaction = prisma.$transaction as jest.Mock;

const VALID_INPUT = {
  name: 'Jane Doe',
  email: 'jane@example.com',
  employmentType: 'SOLE_TRADER' as const,
  password: 'Password1',
  confirmPassword: 'Password1',
};

beforeEach(() => {
  jest.clearAllMocks();
  mockCreate.mockResolvedValue({} as never);
  mockSendPending.mockResolvedValue(undefined);
  mockSendReset.mockResolvedValue(undefined);
  mockTokenCreate.mockResolvedValue({} as never);
  mockTransaction.mockResolvedValue([]);
});

describe('registerUser', () => {
  it('returns field errors when input fails schema validation', async () => {
    const result = await registerUser({ name: '', email: 'bad', employmentType: 'EMPLOYED', password: 'x', confirmPassword: 'y' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.fields).toBeDefined();
    }
    expect(mockFindUnique).not.toHaveBeenCalled();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('returns error when email is already in use', async () => {
    mockFindUnique.mockResolvedValue({ id: 'existing-id' } as never);
    const result = await registerUser(VALID_INPUT);
    expect(result).toEqual({
      success: false,
      error: { message: 'An account with this email already exists.' },
    });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('creates an inactive MEMBER user on valid input', async () => {
    mockFindUnique.mockResolvedValue(null);
    const result = await registerUser(VALID_INPUT);
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        name: 'Jane Doe',
        email: 'jane@example.com',
        passwordHash: 'hashed-password',
        role: 'MEMBER',
        isActive: false,
        employmentType: 'SOLE_TRADER',
      },
    });
    expect(result).toEqual({ success: true });
  });

  it('sends a pending email after successful registration', async () => {
    mockFindUnique.mockResolvedValue(null);
    await registerUser(VALID_INPUT);
    expect(mockSendPending).toHaveBeenCalledWith(VALID_INPUT.email, VALID_INPUT.name);
  });

  it('returns success even if the pending email fails', async () => {
    mockFindUnique.mockResolvedValue(null);
    mockSendPending.mockRejectedValue(new Error('SMTP error'));
    const result = await registerUser(VALID_INPUT);
    expect(result).toEqual({ success: true });
  });

  it('returns success without exposing the created record', async () => {
    mockFindUnique.mockResolvedValue(null);
    const result = await registerUser(VALID_INPUT);
    expect(result).toEqual({ success: true });
  });
});

describe('requestPasswordReset', () => {
  const ACTIVE_CREDENTIALS_USER = {
    id: 'user-id',
    email: 'jane@example.com',
    name: 'Jane Doe',
    isActive: true,
    passwordHash: 'existing-hash',
  };

  it('returns field errors when input fails schema validation', async () => {
    const result = await requestPasswordReset({ email: 'not-an-email' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.fields).toBeDefined();
    }
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  it('creates a token and sends an email when the account exists and is active', async () => {
    mockFindUnique.mockResolvedValue(ACTIVE_CREDENTIALS_USER as never);
    const result = await requestPasswordReset({ email: ACTIVE_CREDENTIALS_USER.email });

    expect(mockTokenCreate).toHaveBeenCalledWith({
      data: {
        tokenHash: 'hashed-token',
        userId: ACTIVE_CREDENTIALS_USER.id,
        expiresAt: new Date('2026-01-01T01:00:00.000Z'),
      },
    });
    expect(mockSendReset).toHaveBeenCalledWith(ACTIVE_CREDENTIALS_USER.email, ACTIVE_CREDENTIALS_USER.name, 'raw-token');
    expect(result).toEqual({ success: true });
  });

  it('returns success without creating a token when no account matches (anti-enumeration)', async () => {
    mockFindUnique.mockResolvedValue(null);
    const result = await requestPasswordReset({ email: 'nobody@example.com' });
    expect(mockTokenCreate).not.toHaveBeenCalled();
    expect(mockSendReset).not.toHaveBeenCalled();
    expect(result).toEqual({ success: true });
  });

  it('returns success without creating a token for inactive accounts', async () => {
    mockFindUnique.mockResolvedValue({ ...ACTIVE_CREDENTIALS_USER, isActive: false } as never);
    const result = await requestPasswordReset({ email: ACTIVE_CREDENTIALS_USER.email });
    expect(mockTokenCreate).not.toHaveBeenCalled();
    expect(result).toEqual({ success: true });
  });

  it('returns success without creating a token for OAuth-only accounts (no passwordHash)', async () => {
    mockFindUnique.mockResolvedValue({ ...ACTIVE_CREDENTIALS_USER, passwordHash: null } as never);
    const result = await requestPasswordReset({ email: ACTIVE_CREDENTIALS_USER.email });
    expect(mockTokenCreate).not.toHaveBeenCalled();
    expect(result).toEqual({ success: true });
  });

  it('returns success even if the reset email fails to send', async () => {
    mockFindUnique.mockResolvedValue(ACTIVE_CREDENTIALS_USER as never);
    mockSendReset.mockRejectedValue(new Error('SMTP error'));
    const result = await requestPasswordReset({ email: ACTIVE_CREDENTIALS_USER.email });
    expect(result).toEqual({ success: true });
  });
});

describe('resetPassword', () => {
  const VALID_RESET_INPUT = {
    token: 'raw-token',
    password: 'Password1',
    confirmPassword: 'Password1',
  };

  const VALID_TOKEN_RECORD = {
    id: 'token-id',
    tokenHash: 'hashed-token',
    userId: 'user-id',
    usedAt: null,
    expiresAt: new Date('2099-01-01T00:00:00.000Z'),
  };

  it('returns field errors when input fails schema validation', async () => {
    const result = await resetPassword({ token: 't', password: 'x', confirmPassword: 'y' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.fields).toBeDefined();
    }
    expect(mockTokenFindUnique).not.toHaveBeenCalled();
  });

  it('rejects when no token record matches the hash', async () => {
    mockTokenFindUnique.mockResolvedValue(null);
    const result = await resetPassword(VALID_RESET_INPUT);
    expect(result).toEqual({
      success: false,
      error: { message: 'This password reset link is invalid or has expired.' },
    });
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it('rejects an already-used token', async () => {
    mockTokenFindUnique.mockResolvedValue({ ...VALID_TOKEN_RECORD, usedAt: new Date() } as never);
    const result = await resetPassword(VALID_RESET_INPUT);
    expect(result.success).toBe(false);
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it('rejects an expired token', async () => {
    mockTokenFindUnique.mockResolvedValue({
      ...VALID_TOKEN_RECORD,
      expiresAt: new Date('2020-01-01T00:00:00.000Z'),
    } as never);
    const result = await resetPassword(VALID_RESET_INPUT);
    expect(result.success).toBe(false);
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it('updates the password and marks the token used on valid input', async () => {
    mockTokenFindUnique.mockResolvedValue(VALID_TOKEN_RECORD as never);
    const result = await resetPassword(VALID_RESET_INPUT);

    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { id: 'user-id' },
      data: { passwordHash: 'hashed-password' },
    });
    expect(mockTokenUpdate).toHaveBeenCalledWith({
      where: { id: 'token-id' },
      data: { usedAt: expect.any(Date) },
    });
    expect(mockTokenUpdateMany).toHaveBeenCalledWith({
      where: { userId: 'user-id', usedAt: null, id: { not: 'token-id' } },
      data: { usedAt: expect.any(Date) },
    });
    expect(mockTransaction).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ success: true });
  });
});
