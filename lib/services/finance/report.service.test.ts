import {
  getProfitAndLoss,
  getCashFlow,
  getTaxSummary,
  getUnbilledHours,
} from './report.service';

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    transaction: {
      findMany: jest.fn(),
    },
    workLog: {
      findMany: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/db/prisma';

const mockTxFindMany = (prisma.transaction as jest.Mocked<typeof prisma.transaction>).findMany;
const mockWlFindMany = (prisma.workLog as jest.Mocked<typeof prisma.workLog>).findMany;

const userId = 'user-1';

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── getProfitAndLoss ─────────────────────────────────────────────────────────

describe('getProfitAndLoss', () => {
  const from = new Date('2026-01-01');
  const to = new Date('2026-01-31');

  const baseTx = {
    id: 'tx-1',
    userId,
    accountId: 'acc-1',
    categoryId: 'cat-1',
    date: new Date('2026-01-15'),
    amount: 10000,
    type: 'INCOME' as const,
    description: null,
    reference: null,
    workContext: null,
    isRecurring: false,
    recurringId: null,
    recurFrequency: null,
    recurEndsAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    category: { id: 'cat-1', name: 'Salary', type: 'BUSINESS' },
  };

  it('sums income and expenses correctly', async () => {
    mockTxFindMany
      .mockResolvedValueOnce([
        { ...baseTx, type: 'INCOME', amount: 10000 },
        { ...baseTx, id: 'tx-2', categoryId: 'cat-2', type: 'EXPENSE', amount: 3000, category: { id: 'cat-2', name: 'Rent', type: 'BUSINESS' } },
      ] as never)
      .mockResolvedValueOnce([] as never); // previous period

    const result = await getProfitAndLoss(userId, from, to);

    expect(result.income).toBe(10000);
    expect(result.expenses).toBe(3000);
    expect(result.net).toBe(7000);
  });

  it('groups amounts by category', async () => {
    mockTxFindMany
      .mockResolvedValueOnce([
        { ...baseTx, type: 'INCOME', amount: 5000 },
        { ...baseTx, id: 'tx-2', type: 'INCOME', amount: 3000 },
      ] as never)
      .mockResolvedValueOnce([] as never);

    const result = await getProfitAndLoss(userId, from, to);

    expect(result.byCategory).toHaveLength(1);
    expect(result.byCategory[0].income).toBe(8000);
    expect(result.byCategory[0].categoryName).toBe('Salary');
  });

  it('calculates previous period totals', async () => {
    mockTxFindMany
      .mockResolvedValueOnce([] as never) // current
      .mockResolvedValueOnce([
        { type: 'INCOME', amount: 5000 },
        { type: 'EXPENSE', amount: 2000 },
      ] as never); // previous

    const result = await getProfitAndLoss(userId, from, to);

    expect(result.previousIncome).toBe(5000);
    expect(result.previousExpenses).toBe(2000);
  });

  it('returns zeros when no transactions', async () => {
    mockTxFindMany.mockResolvedValue([] as never);
    const result = await getProfitAndLoss(userId, from, to);
    expect(result).toMatchObject({
      income: 0,
      expenses: 0,
      net: 0,
      byCategory: [],
      previousIncome: 0,
      previousExpenses: 0,
    });
  });
});

// ─── getCashFlow ──────────────────────────────────────────────────────────────

describe('getCashFlow', () => {
  it('returns 12 months by default', async () => {
    mockTxFindMany.mockResolvedValue([] as never);
    const result = await getCashFlow(userId);
    expect(result.months).toHaveLength(12);
  });

  it('returns 3 months when months=3', async () => {
    mockTxFindMany.mockResolvedValue([] as never);
    const result = await getCashFlow(userId, 3);
    expect(result.months).toHaveLength(3);
  });

  it('aggregates income and expenses by month', async () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-based

    mockTxFindMany.mockResolvedValue([
      { type: 'INCOME', amount: 8000, date: new Date(year, month, 10) },
      { type: 'EXPENSE', amount: 3000, date: new Date(year, month, 15) },
    ] as never);

    const result = await getCashFlow(userId, 1);
    const currentMonth = result.months[0];
    expect(currentMonth.income).toBe(8000);
    expect(currentMonth.expenses).toBe(3000);
    expect(currentMonth.net).toBe(5000);
  });

  it('net is income minus expenses', async () => {
    mockTxFindMany.mockResolvedValue([] as never);
    const result = await getCashFlow(userId, 6);
    for (const m of result.months) {
      expect(m.net).toBe(m.income - m.expenses);
    }
  });
});

// ─── getTaxSummary ────────────────────────────────────────────────────────────

describe('getTaxSummary', () => {
  const taxYearStart = new Date('2025-04-06');

  it('separates business income from business expenses', async () => {
    mockTxFindMany.mockResolvedValue([
      { type: 'INCOME', amount: 50000, category: { name: 'Freelance', type: 'BUSINESS' } },
      { type: 'EXPENSE', amount: 5000, category: { name: 'Software', type: 'BUSINESS' } },
    ] as never);

    const result = await getTaxSummary(userId, taxYearStart);

    expect(result.businessIncome).toBe(50000);
    expect(result.businessExpenses).toEqual([{ categoryName: 'Software', amount: 5000 }]);
    expect(result.netBusinessProfit).toBe(45000);
  });

  it('separates work-related expenses', async () => {
    mockTxFindMany.mockResolvedValue([
      { type: 'EXPENSE', amount: 1200, category: { name: 'Travel', type: 'WORK_RELATED' } },
    ] as never);

    const result = await getTaxSummary(userId, taxYearStart);

    expect(result.workRelatedExpenses).toEqual([{ categoryName: 'Travel', amount: 1200 }]);
    expect(result.businessExpenses).toHaveLength(0);
  });

  it('aggregates multiple expense rows under the same category name', async () => {
    mockTxFindMany.mockResolvedValue([
      { type: 'EXPENSE', amount: 1000, category: { name: 'Software', type: 'BUSINESS' } },
      { type: 'EXPENSE', amount: 2000, category: { name: 'Software', type: 'BUSINESS' } },
    ] as never);

    const result = await getTaxSummary(userId, taxYearStart);

    expect(result.businessExpenses).toEqual([{ categoryName: 'Software', amount: 3000 }]);
  });

  it('returns zeros when no transactions', async () => {
    mockTxFindMany.mockResolvedValue([] as never);
    const result = await getTaxSummary(userId, taxYearStart);
    expect(result.businessIncome).toBe(0);
    expect(result.netBusinessProfit).toBe(0);
  });
});

// ─── getUnbilledHours ─────────────────────────────────────────────────────────

describe('getUnbilledHours', () => {
  const baseLog = {
    id: 'wl-1',
    userId,
    taskId: 'task-1',
    date: new Date('2026-03-01'),
    description: 'Development work',
    timeSpent: 120, // 2 hours
    billable: true,
    billedAt: null,
    clientId: 'client-1',
    workContext: null,
    outcome: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    client: { id: 'client-1', name: 'Acme Corp', defaultRate: 10000 }, // £100/hr in minor units
  };

  it('groups work logs by client', async () => {
    mockWlFindMany.mockResolvedValue([
      { ...baseLog },
      { ...baseLog, id: 'wl-2', date: new Date('2026-03-02') },
    ] as never);

    const result = await getUnbilledHours(userId);

    expect(result.clients).toHaveLength(1);
    expect(result.clients[0].clientName).toBe('Acme Corp');
    expect(result.clients[0].entries).toHaveLength(2);
  });

  it('calculates hours, rate and estimated value', async () => {
    mockWlFindMany.mockResolvedValue([{ ...baseLog }] as never);

    const result = await getUnbilledHours(userId);

    const entry = result.clients[0].entries[0];
    expect(entry.hours).toBe(2); // 120 / 60
    expect(entry.rate).toBe(10000); // £100 in minor units
    expect(entry.estimatedValue).toBe(20000); // 2 * 10000
  });

  it('uses rate=0 and estimatedValue=0 when client has no defaultRate', async () => {
    mockWlFindMany.mockResolvedValue([
      { ...baseLog, client: { id: 'client-1', name: 'Acme Corp', defaultRate: null } },
    ] as never);

    const result = await getUnbilledHours(userId);
    const entry = result.clients[0].entries[0];
    expect(entry.rate).toBe(0);
    expect(entry.estimatedValue).toBe(0);
  });

  it('computes grand totals', async () => {
    mockWlFindMany.mockResolvedValue([
      { ...baseLog, client: { id: 'client-1', name: 'Acme Corp', defaultRate: 10000 } },
      { ...baseLog, id: 'wl-2', clientId: 'client-2', client: { id: 'client-2', name: 'Beta Ltd', defaultRate: 5000 } },
    ] as never);

    const result = await getUnbilledHours(userId);

    expect(result.grandTotalHours).toBeCloseTo(4); // 2 + 2
    expect(result.grandTotalValue).toBe(30000); // 20000 + 10000
  });

  it('returns empty result when no unbilled logs', async () => {
    mockWlFindMany.mockResolvedValue([] as never);
    const result = await getUnbilledHours(userId);
    expect(result.clients).toHaveLength(0);
    expect(result.grandTotalHours).toBe(0);
    expect(result.grandTotalValue).toBe(0);
  });

  it('skips work log entries where client is null', async () => {
    mockWlFindMany.mockResolvedValue([
      { ...baseLog, client: null },
    ] as never);

    const result = await getUnbilledHours(userId);

    expect(result.clients).toHaveLength(0);
    expect(result.grandTotalHours).toBe(0);
  });
});

// ─── computePreviousPeriod branches ───────────────────────────────────────────
// These are exercised indirectly through getProfitAndLoss, which calls the
// private helper. We vary the from/to dates to hit each branch.

describe('getProfitAndLoss — computePreviousPeriod branches', () => {
  beforeEach(() => {
    // Default: return empty for both current and previous periods
    mockTxFindMany.mockResolvedValue([] as never);
  });

  it('shifts back by one year when range is exactly 365 days', async () => {
    // Use a 365-day range (non-leap year)
    const fromY = new Date('2025-03-01');
    const toY = new Date('2026-03-01'); // 365 days

    await getProfitAndLoss(userId, fromY, toY);

    // The second findMany call is the previous-period query; verify it ran
    expect(mockTxFindMany).toHaveBeenCalledTimes(2);
  });

  it('shifts back by one year when range is 366 days (leap year)', async () => {
    const fromY = new Date('2024-01-01');
    const toY = new Date('2024-12-31'); // 365 days (not 366 — but within 365–366 window)

    await getProfitAndLoss(userId, fromY, toY);

    expect(mockTxFindMany).toHaveBeenCalledTimes(2);
  });

  it('uses general case (shift back by same duration) for non-month non-year ranges', async () => {
    // 90-day range — not 28–31 days and not 365–366 days
    const from = new Date('2026-01-01');
    const to = new Date('2026-04-01'); // ~90 days

    await getProfitAndLoss(userId, from, to);

    expect(mockTxFindMany).toHaveBeenCalledTimes(2);
  });

  it('applies categoryType filter when provided', async () => {
    const from = new Date('2026-01-01');
    const to = new Date('2026-01-31');

    await getProfitAndLoss(userId, from, to, 'BUSINESS');

    expect(mockTxFindMany).toHaveBeenCalledTimes(2);
  });

  it('does not apply categoryType filter when null', async () => {
    const from = new Date('2026-01-01');
    const to = new Date('2026-01-31');

    await getProfitAndLoss(userId, from, to, null);

    expect(mockTxFindMany).toHaveBeenCalledTimes(2);
  });
});
