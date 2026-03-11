import { getTransactions, getTransactionById, createTransaction, updateTransaction, deleteTransaction, getTransactionSummary, generateDueRecurrences } from './transaction.service';

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    transaction: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      groupBy: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

import { prisma } from '@/lib/db/prisma';

const mockFindMany = (prisma.transaction as jest.Mocked<typeof prisma.transaction>).findMany;
const mockFindFirst = (prisma.transaction as jest.Mocked<typeof prisma.transaction>).findFirst;
const mockCreate = (prisma.transaction as jest.Mocked<typeof prisma.transaction>).create;
const mockUpdate = (prisma.transaction as jest.Mocked<typeof prisma.transaction>).update;
const mockDelete = (prisma.transaction as jest.Mocked<typeof prisma.transaction>).delete;
const mockGroupBy = (prisma.transaction as jest.Mocked<typeof prisma.transaction>).groupBy;
const mockPrismaTransaction = prisma.$transaction as jest.MockedFunction<typeof prisma.$transaction>;

const userId = 'user-1';

const baseTx = {
  id: 'tx-1', userId, accountId: 'acc-1', categoryId: 'cat-1',
  type: 'INCOME' as const, amount: 5000, date: new Date(), description: null,
  reference: null, workContext: null, isRecurring: false, recurringId: null,
  recurFrequency: null, recurEndsAt: null, createdAt: new Date(), updatedAt: new Date(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getTransactions', () => {
  it('fetches with userId and includes account+category', async () => {
    mockFindMany.mockResolvedValue([]);
    await getTransactions(userId);
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId },
        include: { account: expect.any(Object), category: expect.any(Object) },
        orderBy: { date: 'desc' },
      }),
    );
  });

  it('applies accountId filter', async () => {
    mockFindMany.mockResolvedValue([]);
    await getTransactions(userId, { accountId: 'acc-1' });
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ accountId: 'acc-1' }) }),
    );
  });
});

describe('getTransactionById', () => {
  it('returns null if not found', async () => {
    mockFindFirst.mockResolvedValue(null);
    const result = await getTransactionById(userId, 'tx-1');
    expect(result).toBeNull();
  });
});

describe('createTransaction', () => {
  it('creates a simple INCOME transaction', async () => {
    mockCreate.mockResolvedValue(baseTx);
    const input = { accountId: 'acc-1', categoryId: 'cat-1', type: 'INCOME' as const, amount: 5000, date: new Date() };
    await createTransaction(userId, input);
    expect(mockCreate).toHaveBeenCalledWith({ data: expect.objectContaining({ userId, type: 'INCOME', amount: 5000 }) });
  });

  it('creates paired TRANSFER_IN when type is TRANSFER_OUT', async () => {
    const outTx = { ...baseTx, type: 'TRANSFER_OUT' as const };
    mockPrismaTransaction.mockImplementation(async (fn) => fn({
      transaction: { create: jest.fn().mockResolvedValueOnce(outTx).mockResolvedValue({}) },
    } as never));

    const input = {
      accountId: 'acc-1', categoryId: 'cat-1',
      type: 'TRANSFER_OUT' as const, amount: 1000, date: new Date(),
      transferToAccountId: 'acc-2',
    };
    await createTransaction(userId, input);
    expect(mockPrismaTransaction).toHaveBeenCalled();
  });
});

describe('updateTransaction', () => {
  it('returns null if not found', async () => {
    mockFindFirst.mockResolvedValue(null);
    const result = await updateTransaction(userId, 'tx-1', { amount: 100 });
    expect(result).toBeNull();
  });

  it('updates the transaction when found', async () => {
    mockFindFirst.mockResolvedValue(baseTx);
    mockUpdate.mockResolvedValue({ ...baseTx, amount: 100 });
    const result = await updateTransaction(userId, 'tx-1', { amount: 100 });
    expect(mockUpdate).toHaveBeenCalledWith({ where: { id: 'tx-1' }, data: { amount: 100 } });
    expect(result?.amount).toBe(100);
  });
});

describe('deleteTransaction', () => {
  it('returns false if not found', async () => {
    mockFindFirst.mockResolvedValue(null);
    const result = await deleteTransaction(userId, 'tx-1');
    expect(result).toBe(false);
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('deletes and returns true when found', async () => {
    mockFindFirst.mockResolvedValue(baseTx);
    mockDelete.mockResolvedValue(baseTx);
    const result = await deleteTransaction(userId, 'tx-1');
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: 'tx-1' } });
    expect(result).toBe(true);
  });
});

describe('getTransactionSummary', () => {
  it('sums INCOME and TRANSFER_IN as income, EXPENSE and TRANSFER_OUT as expenses', async () => {
    mockGroupBy.mockResolvedValue([
      { type: 'INCOME', _sum: { amount: 10000 } },
      { type: 'TRANSFER_IN', _sum: { amount: 2000 } },
      { type: 'EXPENSE', _sum: { amount: 3000 } },
      { type: 'TRANSFER_OUT', _sum: { amount: 1000 } },
    ] as never);
    const result = await getTransactionSummary(userId);
    expect(result.totalIncome).toBe(12000);
    expect(result.totalExpenses).toBe(4000);
    expect(result.net).toBe(8000);
  });

  it('returns zeros when no transactions', async () => {
    mockGroupBy.mockResolvedValue([]);
    const result = await getTransactionSummary(userId);
    expect(result).toEqual({ totalIncome: 0, totalExpenses: 0, net: 0 });
  });
});

// ─── generateDueRecurrences ───────────────────────────────────────────────────

describe('generateDueRecurrences', () => {
  const templateBase = {
    ...baseTx,
    isRecurring: true,
    recurFrequency: 'MONTHLY' as const,
    recurEndsAt: null,
    // date set one month ago so next due date is today-ish
    date: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000),
  };

  it('does nothing when there are no recurring templates', async () => {
    mockFindMany.mockResolvedValue([]);
    await generateDueRecurrences(userId);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('creates a new instance when next due date is in the past and no instance exists', async () => {
    mockFindMany.mockResolvedValue([templateBase]);
    // latest = template itself
    mockFindFirst
      .mockResolvedValueOnce(templateBase) // latest in series
      .mockResolvedValueOnce(null);        // idempotency check — no existing instance
    mockCreate.mockResolvedValue({ ...templateBase, id: 'tx-gen-1', isRecurring: false, recurringId: templateBase.id });

    await generateDueRecurrences(userId);

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId,
          accountId: templateBase.accountId,
          categoryId: templateBase.categoryId,
          type: templateBase.type,
          amount: templateBase.amount,
          isRecurring: false,
          recurringId: templateBase.id,
        }),
      }),
    );
  });

  it('skips creation when instance already exists for that date (idempotent)', async () => {
    mockFindMany.mockResolvedValue([templateBase]);
    mockFindFirst
      .mockResolvedValueOnce(templateBase)                                                     // latest
      .mockResolvedValueOnce({ ...templateBase, id: 'tx-existing', recurringId: templateBase.id }); // already exists

    await generateDueRecurrences(userId);

    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('does not generate instances past recurEndsAt', async () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const pastEndTemplate = {
      ...templateBase,
      recurEndsAt: yesterday,
      // date far enough back that next would be past recurEndsAt
      date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    };

    mockFindMany.mockResolvedValue([pastEndTemplate]);
    mockFindFirst.mockResolvedValue(pastEndTemplate); // latest

    await generateDueRecurrences(userId);

    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('uses WEEKLY frequency to advance by 7 days', async () => {
    const weeklyTemplate = {
      ...templateBase,
      recurFrequency: 'WEEKLY' as const,
      date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
    };

    mockFindMany.mockResolvedValue([weeklyTemplate]);
    mockFindFirst
      .mockResolvedValueOnce(weeklyTemplate)
      .mockResolvedValueOnce(null);
    mockCreate.mockResolvedValue({ ...weeklyTemplate, id: 'tx-weekly-1', isRecurring: false, recurringId: weeklyTemplate.id });

    await generateDueRecurrences(userId);

    expect(mockCreate).toHaveBeenCalled();
  });
});
