import { registerUser } from './auth';

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('@/lib/auth/passwords', () => ({
  hashPassword: jest.fn().mockResolvedValue('hashed-password'),
}));

jest.mock('@/lib/email/notifications', () => ({
  sendRegistrationPendingEmail: jest.fn(),
}));

import { prisma } from '@/lib/db/prisma';
import { sendRegistrationPendingEmail } from '@/lib/email/notifications';

const mockFindUnique = (prisma.user as jest.Mocked<typeof prisma.user>).findUnique;
const mockCreate = (prisma.user as jest.Mocked<typeof prisma.user>).create;
const mockSendPending = sendRegistrationPendingEmail as jest.MockedFunction<typeof sendRegistrationPendingEmail>;

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
