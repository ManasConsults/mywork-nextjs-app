import { prisma } from '@/lib/db/prisma';
import type { CategoryType } from '@prisma/client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProfitAndLossResult {
  income: number;
  expenses: number;
  net: number;
  byCategory: {
    categoryId: string;
    categoryName: string;
    categoryType: string;
    income: number;
    expenses: number;
  }[];
  previousIncome: number;
  previousExpenses: number;
}

export interface CashFlowResult {
  months: {
    year: number;
    month: number;
    income: number;
    expenses: number;
    net: number;
  }[];
}

export interface TaxTransaction {
  id: string;
  date: Date;
  type: 'INCOME' | 'EXPENSE';
  categoryName: string;
  categoryType: 'BUSINESS' | 'WORK_RELATED';
  description: string | null;
  reference: string | null;
  accountName: string;
  amount: number;
}

export interface TaxSummaryResult {
  taxYearStart: Date;
  taxYearEnd: Date;
  businessIncome: number;
  businessIncomeByCategory: { categoryName: string; amount: number }[];
  businessExpenses: { categoryName: string; amount: number }[];
  workRelatedExpenses: { categoryName: string; amount: number }[];
  netBusinessProfit: number;
  /** Itemised rows behind the totals above, oldest first. */
  transactions: TaxTransaction[];
}

export interface UnbilledHoursResult {
  clients: {
    clientId: string;
    clientName: string;
    entries: {
      workLogId: string;
      date: Date;
      description: string;
      hours: number;
      rate: number;
      estimatedValue: number;
    }[];
    totalHours: number;
    totalValue: number;
  }[];
  grandTotalHours: number;
  grandTotalValue: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Compute the "previous period" date range for comparison.
 * If the provided range is exactly one calendar month → previous calendar month.
 * Otherwise → shift the same duration backwards.
 */
function computePreviousPeriod(from: Date, to: Date): { prevFrom: Date; prevTo: Date } {
  const rangeMs = to.getTime() - from.getTime();
  const diffDays = Math.round(rangeMs / (1000 * 60 * 60 * 24));

  // Roughly one calendar month (28–31 days)
  if (diffDays >= 28 && diffDays <= 31) {
    const prevFrom = new Date(from);
    prevFrom.setMonth(prevFrom.getMonth() - 1);
    const prevTo = new Date(to);
    prevTo.setMonth(prevTo.getMonth() - 1);
    return { prevFrom, prevTo };
  }

  // Roughly one year
  if (diffDays >= 365 && diffDays <= 366) {
    const prevFrom = new Date(from);
    prevFrom.setFullYear(prevFrom.getFullYear() - 1);
    const prevTo = new Date(to);
    prevTo.setFullYear(prevTo.getFullYear() - 1);
    return { prevFrom, prevTo };
  }

  // General case: shift back by the same duration
  const prevTo = new Date(from.getTime() - 1);
  const prevFrom = new Date(prevTo.getTime() - rangeMs);
  return { prevFrom, prevTo };
}

// ─── FR-FIN-14: Profit & Loss ─────────────────────────────────────────────────

export async function getProfitAndLoss(
  userId: string,
  from: Date,
  to: Date,
  categoryType?: CategoryType | null,
): Promise<ProfitAndLossResult> {
  const categoryFilter = categoryType ? { category: { type: categoryType } } : {};

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: { gte: from, lte: to },
      type: { in: ['INCOME', 'EXPENSE'] },
      ...categoryFilter,
    },
    include: { category: { select: { id: true, name: true, type: true } } },
  });

  // Aggregate totals
  let income = 0;
  let expenses = 0;

  // Group by category
  const categoryMap = new Map<
    string,
    { categoryId: string; categoryName: string; categoryType: string; income: number; expenses: number }
  >();

  for (const tx of transactions) {
    if (tx.type === 'INCOME') {
      income += tx.amount;
    } else if (tx.type === 'EXPENSE') {
      expenses += tx.amount;
    }

    const existing = categoryMap.get(tx.categoryId);
    if (existing) {
      if (tx.type === 'INCOME') existing.income += tx.amount;
      if (tx.type === 'EXPENSE') existing.expenses += tx.amount;
    } else {
      categoryMap.set(tx.categoryId, {
        categoryId: tx.category.id,
        categoryName: tx.category.name,
        categoryType: tx.category.type,
        income: tx.type === 'INCOME' ? tx.amount : 0,
        expenses: tx.type === 'EXPENSE' ? tx.amount : 0,
      });
    }
  }

  // Previous period
  const { prevFrom, prevTo } = computePreviousPeriod(from, to);
  const prevTransactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: { gte: prevFrom, lte: prevTo },
      type: { in: ['INCOME', 'EXPENSE'] },
      ...categoryFilter,
    },
    select: { type: true, amount: true },
  });

  let previousIncome = 0;
  let previousExpenses = 0;
  for (const tx of prevTransactions) {
    if (tx.type === 'INCOME') previousIncome += tx.amount;
    if (tx.type === 'EXPENSE') previousExpenses += tx.amount;
  }

  return {
    income,
    expenses,
    net: income - expenses,
    byCategory: Array.from(categoryMap.values()),
    previousIncome,
    previousExpenses,
  };
}

// ─── FR-FIN-15: Cash Flow ─────────────────────────────────────────────────────

export async function getCashFlow(userId: string, months = 12): Promise<CashFlowResult> {
  const now = new Date();
  // Start of the current month
  const rangeEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  // Start of the first month in range
  const rangeStart = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: { gte: rangeStart, lte: rangeEnd },
      type: { in: ['INCOME', 'EXPENSE'] },
    },
    select: { type: true, amount: true, date: true },
    orderBy: { date: 'asc' },
  });

  // Build a map of year-month → totals
  const monthMap = new Map<string, { year: number; month: number; income: number; expenses: number }>();

  // Pre-populate all months so months with no transactions still appear
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    monthMap.set(key, { year: d.getFullYear(), month: d.getMonth() + 1, income: 0, expenses: 0 });
  }

  for (const tx of transactions) {
    const d = new Date(tx.date);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    const entry = monthMap.get(key);
    if (entry) {
      if (tx.type === 'INCOME') entry.income += tx.amount;
      if (tx.type === 'EXPENSE') entry.expenses += tx.amount;
    }
  }

  const result = Array.from(monthMap.values()).map((m) => ({
    ...m,
    net: m.income - m.expenses,
  }));

  return { months: result };
}

// ─── FR-FIN-16: Tax Summary ───────────────────────────────────────────────────

export async function getTaxSummary(
  userId: string,
  taxYearStart: Date,
): Promise<TaxSummaryResult> {
  const taxYearEnd = new Date(taxYearStart);
  taxYearEnd.setFullYear(taxYearEnd.getFullYear() + 1);
  taxYearEnd.setDate(taxYearEnd.getDate() - 1);
  taxYearEnd.setHours(23, 59, 59, 999);

  const rows = await prisma.transaction.findMany({
    where: {
      userId,
      date: { gte: taxYearStart, lte: taxYearEnd },
      type: { in: ['INCOME', 'EXPENSE'] },
      category: { type: { in: ['BUSINESS', 'WORK_RELATED'] } },
    },
    include: {
      category: { select: { name: true, type: true } },
      account: { select: { name: true } },
    },
    orderBy: { date: 'asc' },
  });

  const businessIncomeMap = new Map<string, number>();
  const businessExpenseMap = new Map<string, number>();
  const workRelatedExpenseMap = new Map<string, number>();
  const transactions: TaxTransaction[] = [];

  for (const tx of rows) {
    let target: Map<string, number> | null = null;
    if (tx.category.type === 'BUSINESS') {
      target = tx.type === 'INCOME' ? businessIncomeMap : businessExpenseMap;
    } else if (tx.category.type === 'WORK_RELATED' && tx.type === 'EXPENSE') {
      target = workRelatedExpenseMap;
    }
    // Work-related income is not part of the tax summary, so it is left out of the itemised list too
    if (!target) continue;

    target.set(tx.category.name, (target.get(tx.category.name) ?? 0) + tx.amount);
    transactions.push({
      id: tx.id,
      date: tx.date,
      type: tx.type as TaxTransaction['type'],
      categoryName: tx.category.name,
      categoryType: tx.category.type as TaxTransaction['categoryType'],
      description: tx.description,
      reference: tx.reference,
      accountName: tx.account.name,
      amount: tx.amount,
    });
  }

  const toRows = (map: Map<string, number>): { categoryName: string; amount: number }[] =>
    Array.from(map.entries()).map(([categoryName, amount]) => ({ categoryName, amount }));

  const businessIncomeByCategory = toRows(businessIncomeMap);
  const businessExpenses = toRows(businessExpenseMap);
  const workRelatedExpenses = toRows(workRelatedExpenseMap);

  const businessIncome = businessIncomeByCategory.reduce((sum, e) => sum + e.amount, 0);
  const totalBusinessExpenses = businessExpenses.reduce((sum, e) => sum + e.amount, 0);

  return {
    taxYearStart,
    taxYearEnd,
    businessIncome,
    businessIncomeByCategory,
    businessExpenses,
    workRelatedExpenses,
    netBusinessProfit: businessIncome - totalBusinessExpenses,
    transactions,
  };
}

// ─── FR-FIN-17: Unbilled Hours ────────────────────────────────────────────────

export async function getUnbilledHours(userId: string): Promise<UnbilledHoursResult> {
  const workLogs = await prisma.workLog.findMany({
    where: {
      userId,
      billable: true,
      billedAt: null,
      clientId: { not: null },
    },
    include: {
      client: { select: { id: true, name: true, defaultRate: true } },
    },
    orderBy: { date: 'asc' },
  });

  const clientMap = new Map<
    string,
    {
      clientId: string;
      clientName: string;
      entries: {
        workLogId: string;
        date: Date;
        description: string;
        hours: number;
        rate: number;
        estimatedValue: number;
      }[];
      totalHours: number;
      totalValue: number;
    }
  >();

  for (const log of workLogs) {
    // clientId is guaranteed non-null due to the query filter
    if (!log.client) continue;

    const hours = (log.timeSpent ?? 0) / 60;
    const rate = log.client.defaultRate ?? 0;
    const estimatedValue = Math.round(hours * rate);

    const existing = clientMap.get(log.client.id);
    if (existing) {
      existing.entries.push({
        workLogId: log.id,
        date: log.date,
        description: log.description,
        hours,
        rate,
        estimatedValue,
      });
      existing.totalHours += hours;
      existing.totalValue += estimatedValue;
    } else {
      clientMap.set(log.client.id, {
        clientId: log.client.id,
        clientName: log.client.name,
        entries: [
          {
            workLogId: log.id,
            date: log.date,
            description: log.description,
            hours,
            rate,
            estimatedValue,
          },
        ],
        totalHours: hours,
        totalValue: estimatedValue,
      });
    }
  }

  const clients = Array.from(clientMap.values());
  const grandTotalHours = clients.reduce((sum, c) => sum + c.totalHours, 0);
  const grandTotalValue = clients.reduce((sum, c) => sum + c.totalValue, 0);

  return { clients, grandTotalHours, grandTotalValue };
}
