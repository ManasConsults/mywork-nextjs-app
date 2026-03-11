import { prisma } from '@/lib/db/prisma';
import type { CreateAccountInput, UpdateAccountInput } from '@/lib/schemas/finance/account.schema';
import type { Account } from '@prisma/client';

export async function getAccounts(userId: string): Promise<Account[]> {
  return prisma.account.findMany({
    where: { userId, archivedAt: null },
    orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
  });
}

export async function getAccountById(userId: string, id: string): Promise<Account | null> {
  return prisma.account.findFirst({ where: { id, userId } });
}

export async function getAccountBalance(userId: string, id: string): Promise<number> {
  const account = await prisma.account.findFirst({ where: { id, userId } });
  if (!account) return 0;

  const agg = await prisma.transaction.groupBy({
    by: ['type'],
    where: { accountId: id, userId },
    _sum: { amount: true },
  });

  let income = 0;
  let expenses = 0;
  for (const row of agg) {
    const sum = row._sum.amount ?? 0;
    if (row.type === 'INCOME' || row.type === 'TRANSFER_IN') income += sum;
    if (row.type === 'EXPENSE' || row.type === 'TRANSFER_OUT') expenses += sum;
  }

  return account.openingBalance + income - expenses;
}

export async function createAccount(
  userId: string,
  data: CreateAccountInput,
): Promise<Account> {
  return prisma.$transaction(async (tx) => {
    if (data.isDefault) {
      await tx.account.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }
    return tx.account.create({ data: { ...data, userId } });
  });
}

export async function updateAccount(
  userId: string,
  id: string,
  data: UpdateAccountInput,
): Promise<Account | null> {
  const existing = await prisma.account.findFirst({ where: { id, userId } });
  if (!existing) return null;

  return prisma.$transaction(async (tx) => {
    if (data.isDefault) {
      await tx.account.updateMany({
        where: { userId, isDefault: true, NOT: { id } },
        data: { isDefault: false },
      });
    }
    return tx.account.update({ where: { id }, data });
  });
}

export async function archiveAccount(userId: string, id: string): Promise<Account | null> {
  const existing = await prisma.account.findFirst({ where: { id, userId } });
  if (!existing) return null;
  return prisma.account.update({ where: { id }, data: { archivedAt: new Date() } });
}
