import { getAccounts, getAccountById, getAccountBalance, createAccount, updateAccount, archiveAccount } from './account.service';

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    account: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    transaction: {
      groupBy: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

import { prisma } from '@/lib/db/prisma';

const mockAccountFindMany = (prisma.account as jest.Mocked<typeof prisma.account>).findMany;
const mockAccountFindFirst = (prisma.account as jest.Mocked<typeof prisma.account>).findFirst;
const mockAccountUpdate = (prisma.account as jest.Mocked<typeof prisma.account>).update;
const mockTransactionGroupBy = (prisma.transaction as jest.Mocked<typeof prisma.transaction>).groupBy;
const mockPrismaTransaction = prisma.$transaction as jest.MockedFunction<typeof prisma.$transaction>;

const userId = 'user-1';
const accountId = 'account-1';

const baseAccount = {
  id: accountId,
  userId,
  name: 'Main Checking',
  type: 'CHECKING' as const,
  openingBalance: 10000,
  currency: 'GBP',
  isDefault: true,
  description: null,
  bankName: null,
  accountNumber: null,
  bsb: null,
  iban: null,
  swiftBic: null,
  archivedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getAccounts', () => {
  it('queries with archivedAt: null filter', async () => {
    mockAccountFindMany.mockResolvedValue([baseAccount]);
    const result = await getAccounts(userId);
    expect(mockAccountFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId, archivedAt: null } }),
    );
    expect(result).toEqual([baseAccount]);
  });
});

describe('getAccountById', () => {
  it('returns account when found', async () => {
    mockAccountFindFirst.mockResolvedValue(baseAccount);
    const result = await getAccountById(userId, accountId);
    expect(mockAccountFindFirst).toHaveBeenCalledWith({ where: { id: accountId, userId } });
    expect(result).toEqual(baseAccount);
  });

  it('returns null when not found', async () => {
    mockAccountFindFirst.mockResolvedValue(null);
    const result = await getAccountById(userId, accountId);
    expect(result).toBeNull();
  });
});

describe('getAccountBalance', () => {
  it('returns 0 if account not found', async () => {
    mockAccountFindFirst.mockResolvedValue(null);
    const result = await getAccountBalance(userId, accountId);
    expect(result).toBe(0);
  });

  it('computes balance from opening balance + income - expenses', async () => {
    mockAccountFindFirst.mockResolvedValue(baseAccount); // openingBalance: 10000
    mockTransactionGroupBy.mockResolvedValue([
      { type: 'INCOME', _sum: { amount: 5000 } },
      { type: 'EXPENSE', _sum: { amount: 2000 } },
    ] as never);
    const result = await getAccountBalance(userId, accountId);
    // 10000 + 5000 - 2000 = 13000
    expect(result).toBe(13000);
  });

  it('counts TRANSFER_IN as income and TRANSFER_OUT as expense', async () => {
    mockAccountFindFirst.mockResolvedValue({ ...baseAccount, openingBalance: 0 });
    mockTransactionGroupBy.mockResolvedValue([
      { type: 'TRANSFER_IN', _sum: { amount: 3000 } },
      { type: 'TRANSFER_OUT', _sum: { amount: 1000 } },
    ] as never);
    const result = await getAccountBalance(userId, accountId);
    expect(result).toBe(2000);
  });
});

describe('createAccount', () => {
  it('creates account without clearing defaults when isDefault is false', async () => {
    const created = { ...baseAccount, isDefault: false };
    mockPrismaTransaction.mockImplementation(async (fn) => fn({
      account: { updateMany: jest.fn(), create: jest.fn().mockResolvedValue(created) },
    } as never));
    const input = { name: 'Savings', type: 'SAVINGS' as const, openingBalance: 0, currency: 'GBP', isDefault: false };
    const result = await createAccount(userId, input);
    expect(result).toEqual(created);
  });
});

describe('archiveAccount', () => {
  it('returns null if account not found', async () => {
    mockAccountFindFirst.mockResolvedValue(null);
    const result = await archiveAccount(userId, accountId);
    expect(result).toBeNull();
    expect(mockAccountUpdate).not.toHaveBeenCalled();
  });

  it('sets archivedAt on the account', async () => {
    mockAccountFindFirst.mockResolvedValue(baseAccount);
    mockAccountUpdate.mockResolvedValue({ ...baseAccount, archivedAt: new Date() });
    const result = await archiveAccount(userId, accountId);
    expect(mockAccountUpdate).toHaveBeenCalledWith({
      where: { id: accountId },
      data: { archivedAt: expect.any(Date) },
    });
    expect(result?.archivedAt).toBeInstanceOf(Date);
  });
});

describe('updateAccount', () => {
  it('returns null if account not found', async () => {
    mockAccountFindFirst.mockResolvedValue(null);
    const result = await updateAccount(userId, accountId, { name: 'Updated' });
    expect(result).toBeNull();
  });
});
