import { prisma } from '@/lib/db/prisma';
import type { CreateTransactionInput, TransactionFilters, UpdateTransactionInput } from '@/lib/schemas/finance/transaction.schema';
import type { Transaction } from '@prisma/client';

type TransactionWithRelations = Transaction & {
  account: { name: string };
  category: { name: string; type: string };
};

export async function getTransactions(
  userId: string,
  filters?: TransactionFilters,
): Promise<TransactionWithRelations[]> {
  return prisma.transaction.findMany({
    where: {
      userId,
      ...(filters?.accountId ? { accountId: filters.accountId } : {}),
      ...(filters?.categoryId ? { categoryId: filters.categoryId } : {}),
      ...(filters?.type ? { type: filters.type } : {}),
      ...(filters?.from || filters?.to
        ? {
            date: {
              ...(filters.from ? { gte: filters.from } : {}),
              ...(filters.to ? { lte: filters.to } : {}),
            },
          }
        : {}),
    },
    include: {
      account: { select: { name: true } },
      category: { select: { name: true, type: true } },
    },
    orderBy: { date: 'desc' },
  }) as Promise<TransactionWithRelations[]>;
}

export async function getTransactionById(
  userId: string,
  id: string,
): Promise<TransactionWithRelations | null> {
  return prisma.transaction.findFirst({
    where: { id, userId },
    include: {
      account: { select: { name: true } },
      category: { select: { name: true, type: true } },
    },
  }) as Promise<TransactionWithRelations | null>;
}

export async function createTransaction(
  userId: string,
  data: CreateTransactionInput,
): Promise<Transaction> {
  const { transferToAccountId, ...rest } = data;

  // For transfers, create a paired TRANSFER_IN in the same DB transaction
  if (rest.type === 'TRANSFER_OUT' && transferToAccountId) {
    return prisma.$transaction(async (tx) => {
      const out = await tx.transaction.create({
        data: { ...rest, userId },
      });
      await tx.transaction.create({
        data: {
          userId,
          accountId: transferToAccountId,
          categoryId: rest.categoryId,
          type: 'TRANSFER_IN',
          amount: rest.amount,
          date: rest.date,
          description: rest.description,
          reference: rest.reference ?? out.id, // link back to the OUT record
          workContext: rest.workContext,
        },
      });
      return out;
    });
  }

  return prisma.transaction.create({ data: { ...rest, userId } });
}

export async function updateTransaction(
  userId: string,
  id: string,
  data: UpdateTransactionInput,
): Promise<Transaction | null> {
  const existing = await prisma.transaction.findFirst({ where: { id, userId } });
  if (!existing) return null;
  const { transferToAccountId: _transferToAccountId, ...rest } = data; // eslint-disable-line @typescript-eslint/no-unused-vars
  return prisma.transaction.update({ where: { id }, data: rest });
}

export async function deleteTransaction(userId: string, id: string): Promise<boolean> {
  const existing = await prisma.transaction.findFirst({ where: { id, userId } });
  if (!existing) return false;
  await prisma.transaction.delete({ where: { id } });
  return true;
}

export async function getTransactionSummary(
  userId: string,
  from?: Date,
  to?: Date,
): Promise<{ totalIncome: number; totalExpenses: number; net: number }> {
  const dateFilter = from || to
    ? { date: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
    : {};

  const agg = await prisma.transaction.groupBy({
    by: ['type'],
    where: { userId, ...dateFilter },
    _sum: { amount: true },
  });

  let totalIncome = 0;
  let totalExpenses = 0;
  for (const row of agg) {
    const sum = row._sum.amount ?? 0;
    if (row.type === 'INCOME' || row.type === 'TRANSFER_IN') totalIncome += sum;
    if (row.type === 'EXPENSE' || row.type === 'TRANSFER_OUT') totalExpenses += sum;
  }

  return { totalIncome, totalExpenses, net: totalIncome - totalExpenses };
}

// ─── Recurring Transaction Generation (SAD-002 §6.6) ─────────────────────────

const MAX_INSTANCES_PER_SERIES = 366;

function addPeriod(date: Date, frequency: string): Date {
  const d = new Date(date);
  switch (frequency) {
    case 'WEEKLY':       d.setDate(d.getDate() + 7); break;
    case 'FORTNIGHTLY':  d.setDate(d.getDate() + 14); break;
    case 'MONTHLY':      d.setMonth(d.getMonth() + 1); break;
    case 'QUARTERLY':    d.setMonth(d.getMonth() + 3); break;
    case 'ANNUALLY':     d.setFullYear(d.getFullYear() + 1); break;
  }
  return d;
}

/**
 * Generates any overdue recurring transaction instances for the user.
 * Called on Finance dashboard and transactions page load (idempotent).
 */
export async function generateDueRecurrences(userId: string): Promise<void> {
  const today = new Date();
  today.setHours(23, 59, 59, 999); // inclusive of today

  // Fetch all template (root) recurring transactions for this user
  const templates = await prisma.transaction.findMany({
    where: {
      userId,
      isRecurring: true,
      recurFrequency: { not: null },
      OR: [{ recurEndsAt: null }, { recurEndsAt: { gte: new Date() } }],
    },
  });

  for (const template of templates) {
    if (!template.recurFrequency) continue;

    // Find the most recent instance in the series (template itself or any generated copy)
    const latest = await prisma.transaction.findFirst({
      where: { userId, OR: [{ id: template.id }, { recurringId: template.id }] },
      orderBy: { date: 'desc' },
    });

    let nextDate = addPeriod(latest?.date ?? template.date, template.recurFrequency);
    let count = 0;

    while (nextDate <= today && count < MAX_INSTANCES_PER_SERIES) {
      if (template.recurEndsAt && nextDate > template.recurEndsAt) break;

      // Idempotency: skip if an instance already exists for this date in the series
      const exists = await prisma.transaction.findFirst({
        where: {
          userId,
          recurringId: template.id,
          date: { gte: new Date(nextDate.setHours(0, 0, 0, 0)), lte: new Date(nextDate.setHours(23, 59, 59, 999)) },
        },
      });

      if (!exists) {
        await prisma.transaction.create({
          data: {
            userId,
            accountId: template.accountId,
            categoryId: template.categoryId,
            type: template.type,
            amount: template.amount,
            date: new Date(nextDate),
            description: template.description,
            reference: template.reference,
            workContext: template.workContext,
            isRecurring: false,
            recurringId: template.id,
          },
        });
      }

      nextDate = addPeriod(new Date(nextDate), template.recurFrequency);
      count++;
    }
  }
}
