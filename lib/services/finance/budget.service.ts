import { prisma } from '@/lib/db/prisma';
import type { CreateBudgetInput, UpdateBudgetInput } from '@/lib/schemas/finance/budget.schema';
import type { Budget, Category } from '@prisma/client';

export type BudgetWithCategory = Budget & { category: Category };

export type BudgetProgress = {
  budget: Budget;
  category: Category;
  spent: number;
  remaining: number;
  percentUsed: number;
};

/**
 * Returns the inclusive date range for the budget's current active period.
 * MONTHLY  → the calendar month containing today.
 * ANNUAL   → the 12-month window starting on the same month/day as startDate
 *            but in the year that contains today (rolling forward if needed).
 */
function getCurrentPeriodWindow(
  period: 'MONTHLY' | 'ANNUAL',
  startDate: Date,
): { from: Date; to: Date } {
  const now = new Date();

  if (period === 'MONTHLY') {
    const from = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { from, to };
  }

  // ANNUAL: 12-month window from the anniversary of startDate this year
  const anniversaryThisYear = new Date(
    now.getFullYear(),
    startDate.getMonth(),
    startDate.getDate(),
    0,
    0,
    0,
    0,
  );

  // If we haven't reached this year's anniversary yet, use last year's window
  const windowStart =
    now >= anniversaryThisYear
      ? anniversaryThisYear
      : new Date(
          now.getFullYear() - 1,
          startDate.getMonth(),
          startDate.getDate(),
          0,
          0,
          0,
          0,
        );

  const windowEnd = new Date(
    windowStart.getFullYear() + 1,
    windowStart.getMonth(),
    windowStart.getDate() - 1,
    23,
    59,
    59,
    999,
  );

  return { from: windowStart, to: windowEnd };
}

export async function getBudgets(userId: string): Promise<BudgetWithCategory[]> {
  return prisma.budget.findMany({
    where: { userId },
    include: { category: true },
    orderBy: [{ period: 'asc' }, { startDate: 'desc' }],
  }) as Promise<BudgetWithCategory[]>;
}

export async function getBudgetProgress(
  userId: string,
  budgetId: string,
): Promise<BudgetProgress | null> {
  const budget = await prisma.budget.findFirst({
    where: { id: budgetId, userId },
    include: { category: true },
  });

  if (!budget) return null;

  const { from, to } = getCurrentPeriodWindow(budget.period, budget.startDate);

  const agg = await prisma.transaction.aggregate({
    where: {
      userId,
      categoryId: budget.categoryId,
      type: 'EXPENSE',
      date: { gte: from, lte: to },
    },
    _sum: { amount: true },
  });

  const spent = agg._sum.amount ?? 0;
  const remaining = Math.max(0, budget.amount - spent);
  const percentUsed = budget.amount > 0 ? Math.round((spent / budget.amount) * 100) : 0;

  return {
    budget,
    category: (budget as BudgetWithCategory).category,
    spent,
    remaining,
    percentUsed,
  };
}

export async function createBudget(
  userId: string,
  data: CreateBudgetInput,
): Promise<Budget> {
  return prisma.budget.create({ data: { ...data, userId } });
}

export async function updateBudget(
  userId: string,
  id: string,
  data: UpdateBudgetInput,
): Promise<Budget | null> {
  const existing = await prisma.budget.findFirst({ where: { id, userId } });
  if (!existing) return null;
  return prisma.budget.update({ where: { id }, data });
}

export async function deleteBudget(userId: string, id: string): Promise<boolean> {
  const existing = await prisma.budget.findFirst({ where: { id, userId } });
  if (!existing) return false;
  await prisma.budget.delete({ where: { id } });
  return true;
}
