import { createAccountAction, updateAccountAction, archiveAccountAction } from './account';

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth/auth', () => ({ authOptions: {} }));
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('@/lib/services/finance/account.service', () => ({
  createAccount: jest.fn(),
  updateAccount: jest.fn(),
  archiveAccount: jest.fn(),
}));

import { getServerSession } from 'next-auth';
import { createAccount, updateAccount, archiveAccount } from '@/lib/services/finance/account.service';

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockCreateAccount = createAccount as jest.MockedFunction<typeof createAccount>;
const mockUpdateAccount = updateAccount as jest.MockedFunction<typeof updateAccount>;
const mockArchiveAccount = archiveAccount as jest.MockedFunction<typeof archiveAccount>;

const session = { user: { id: 'user-1', role: 'MEMBER' }, expires: '' };

const baseAccount = {
  id: 'acc-1', userId: 'user-1', name: 'Main', type: 'CHECKING' as const,
  openingBalance: 0, currency: 'GBP', isDefault: false, description: null,
  bankName: null, accountNumber: null, bsb: null, iban: null, swiftBic: null,
  archivedAt: null, createdAt: new Date(), updatedAt: new Date(),
};

const validInput = { name: 'Main', type: 'CHECKING' as const, openingBalance: 0, currency: 'GBP', isDefault: false };

beforeEach(() => {
  jest.clearAllMocks();
});

describe('createAccountAction', () => {
  it('returns Unauthorized when no session', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const result = await createAccountAction(validInput);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.message).toBe('You must be signed in.');
    expect(mockCreateAccount).not.toHaveBeenCalled();
  });

  it('returns field errors on invalid input', async () => {
    mockGetServerSession.mockResolvedValue(session as never);
    const result = await createAccountAction({ name: '', type: 'CHECKING' as const, openingBalance: 0, currency: 'GBP', isDefault: false });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.fields).toBeDefined();
    expect(mockCreateAccount).not.toHaveBeenCalled();
  });

  it('returns the created account on success', async () => {
    mockGetServerSession.mockResolvedValue(session as never);
    mockCreateAccount.mockResolvedValue(baseAccount);
    const result = await createAccountAction(validInput);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual(baseAccount);
  });
});

describe('updateAccountAction', () => {
  it('returns Unauthorized when no session', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const result = await updateAccountAction('acc-1', { name: 'Updated' });
    expect(result.success).toBe(false);
  });

  it('returns not found when service returns null', async () => {
    mockGetServerSession.mockResolvedValue(session as never);
    mockUpdateAccount.mockResolvedValue(null);
    const result = await updateAccountAction('acc-1', { name: 'Updated' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.message).toBe('Account not found.');
  });

  it('returns success with updated account', async () => {
    mockGetServerSession.mockResolvedValue(session as never);
    mockUpdateAccount.mockResolvedValue({ ...baseAccount, name: 'Updated' });
    const result = await updateAccountAction('acc-1', { name: 'Updated' });
    expect(result.success).toBe(true);
  });
});

describe('archiveAccountAction', () => {
  it('returns Unauthorized when no session', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const result = await archiveAccountAction('acc-1');
    expect(result.success).toBe(false);
  });

  it('returns not found when service returns null', async () => {
    mockGetServerSession.mockResolvedValue(session as never);
    mockArchiveAccount.mockResolvedValue(null);
    const result = await archiveAccountAction('acc-1');
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.message).toBe('Account not found.');
  });

  it('returns success when archived', async () => {
    mockGetServerSession.mockResolvedValue(session as never);
    mockArchiveAccount.mockResolvedValue({ ...baseAccount, archivedAt: new Date() });
    const result = await archiveAccountAction('acc-1');
    expect(result.success).toBe(true);
  });
});
