import {
  getBudgets,
  getBudgetProgress,
  createBudget,
  updateBudget,
  deleteBudget,
} from './budget.service';

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    budget: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    transaction: {
      aggregate: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/db/prisma';

const mockBudgetFindMany = (prisma.budget as jest.Mocked<typeof prisma.budget>).findMany;
const mockBudgetFindFirst = (prisma.budget as jest.Mocked<typeof prisma.budget>).findFirst;
const mockBudgetCreate = (prisma.budget as jest.Mocked<typeof prisma.budget>).create;
const mockBudgetUpdate = (prisma.budget as jest.Mocked<typeof prisma.budget>).update;
const mockBudgetDelete = (prisma.budget as jest.Mocked<typeof prisma.budget>).delete;
const mockTransactionAggregate = (
  prisma.transaction as jest.Mocked<typeof prisma.transaction>
).aggregate;

const userId = 'user-1';
const budgetId = 'budget-1';
const categoryId = 'cat-1';

const baseCategory = {
  id: categoryId,
  userId,
  name: 'Groceries',
  type: 'PERSONAL' as const,
  parentId: null,
  colour: null,
  icon: null,
  createdAt: new Date('2026-01-01'),
};

const baseBudget = {
  id: budgetId,
  userId,
  categoryId,
  amount: 20000, // £200.00 in minor units
  period: 'MONTHLY' as const,
  startDate: new Date('2026-01-01'),
  endDate: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

const budgetWithCategory = { ...baseBudget, category: baseCategory };

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── getBudgets ─────────────────────────────────────────────────────────────

describe('getBudgets', () => {
  it("returns only the requesting user's budgets with category included", async () => {
    mockBudgetFindMany.mockResolvedValue([budgetWithCategory] as never);

    const result = await getBudgets(userId);

    expect(mockBudgetFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId },
        include: { category: true },
      }),
    );
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(budgetId);
  });

  it('returns empty array when user has no budgets', async () => {
    mockBudgetFindMany.mockResolvedValue([]);
    const result = await getBudgets(userId);
    expect(result).toEqual([]);
  });
});

// ─── getBudgetProgress ───────────────────────────────────────────────────────

describe('getBudgetProgress', () => {
  it('returns null when budget is not found or does not belong to user', async () => {
    mockBudgetFindFirst.mockResolvedValue(null);

    const result = await getBudgetProgress(userId, 'other-budget');

    expect(result).toBeNull();
    expect(mockTransactionAggregate).not.toHaveBeenCalled();
  });

  it('calculates spent, remaining, and percentUsed correctly', async () => {
    mockBudgetFindFirst.mockResolvedValue(budgetWithCategory as never);
    // £50.00 spent (5000 minor units) out of £200.00 budget (20000 minor units)
    mockTransactionAggregate.mockResolvedValue({
      _sum: { amount: 5000 },
    } as never);

    const result = await getBudgetProgress(userId, budgetId);

    expect(result).not.toBeNull();
    expect(result!.spent).toBe(5000);
    expect(result!.remaining).toBe(15000);
    expect(result!.percentUsed).toBe(25);
    expect(result!.category.name).toBe('Groceries');
  });

  it('queries only EXPENSE transactions for the category', async () => {
    mockBudgetFindFirst.mockResolvedValue(budgetWithCategory as never);
    mockTransactionAggregate.mockResolvedValue({ _sum: { amount: 0 } } as never);

    await getBudgetProgress(userId, budgetId);

    expect(mockTransactionAggregate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId,
          categoryId,
          type: 'EXPENSE',
        }),
      }),
    );
  });

  it('treats null aggregate sum as zero spent', async () => {
    mockBudgetFindFirst.mockResolvedValue(budgetWithCategory as never);
    mockTransactionAggregate.mockResolvedValue({ _sum: { amount: null } } as never);

    const result = await getBudgetProgress(userId, budgetId);

    expect(result!.spent).toBe(0);
    expect(result!.remaining).toBe(baseBudget.amount);
    expect(result!.percentUsed).toBe(0);
  });

  it('caps remaining at 0 when budget is exceeded', async () => {
    mockBudgetFindFirst.mockResolvedValue(budgetWithCategory as never);
    // Spent £250.00 against £200.00 budget
    mockTransactionAggregate.mockResolvedValue({ _sum: { amount: 25000 } } as never);

    const result = await getBudgetProgress(userId, budgetId);

    expect(result!.spent).toBe(25000);
    expect(result!.remaining).toBe(0);
    expect(result!.percentUsed).toBe(125);
  });
});

// ─── createBudget ────────────────────────────────────────────────────────────

describe('createBudget', () => {
  it('creates a budget with the correct userId and data', async () => {
    mockBudgetCreate.mockResolvedValue(baseBudget as never);

    const input = {
      categoryId,
      amount: 20000,
      period: 'MONTHLY' as const,
      startDate: new Date('2026-01-01'),
    };

    const result = await createBudget(userId, input);

    expect(mockBudgetCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ ...input, userId }),
    });
    expect(result.id).toBe(budgetId);
  });

  it('propagates unique constraint errors so the action can handle them', async () => {
    const uniqueError = new Error(
      'Unique constraint failed on the fields: (`userId`,`categoryId`,`period`,`startDate`)',
    );
    mockBudgetCreate.mockRejectedValue(uniqueError);

    await expect(
      createBudget(userId, {
        categoryId,
        amount: 10000,
        period: 'MONTHLY',
        startDate: new Date('2026-01-01'),
      }),
    ).rejects.toThrow('Unique constraint failed');
  });
});

// ─── updateBudget ────────────────────────────────────────────────────────────

describe('updateBudget', () => {
  it('returns null when the budget does not belong to the requesting user', async () => {
    mockBudgetFindFirst.mockResolvedValue(null);

    const result = await updateBudget('other-user', budgetId, { amount: 30000 });

    expect(result).toBeNull();
    expect(mockBudgetUpdate).not.toHaveBeenCalled();
  });

  it('updates the budget when it belongs to the user', async () => {
    mockBudgetFindFirst.mockResolvedValue(baseBudget as never);
    mockBudgetUpdate.mockResolvedValue({ ...baseBudget, amount: 30000 } as never);

    const result = await updateBudget(userId, budgetId, { amount: 30000 });

    expect(mockBudgetUpdate).toHaveBeenCalledWith({
      where: { id: budgetId },
      data: { amount: 30000 },
    });
    expect(result?.amount).toBe(30000);
  });
});

// ─── deleteBudget ────────────────────────────────────────────────────────────

describe('deleteBudget', () => {
  it('returns false when the budget does not belong to the requesting user', async () => {
    mockBudgetFindFirst.mockResolvedValue(null);

    const result = await deleteBudget('other-user', budgetId);

    expect(result).toBe(false);
    expect(mockBudgetDelete).not.toHaveBeenCalled();
  });

  it('deletes the budget and returns true when it belongs to the user', async () => {
    mockBudgetFindFirst.mockResolvedValue(baseBudget as never);
    mockBudgetDelete.mockResolvedValue(baseBudget as never);

    const result = await deleteBudget(userId, budgetId);

    expect(mockBudgetDelete).toHaveBeenCalledWith({ where: { id: budgetId } });
    expect(result).toBe(true);
  });
});
