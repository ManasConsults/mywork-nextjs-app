import type { Prisma } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';

export const EXPORT_PAGE_SIZE = 500;

export interface ExportRow {
  id: string;
}

export interface AccountDataEntry {
  /** Prisma model name; the registry test checks this against the generated datamodel. */
  model: string;
  /** Key in the export envelope; null when the rows are nested under another entry or never exported. */
  exportKey: string | null;
  /** Hard-deletes every row the user owns (including soft-deleted ones); returns the count. */
  erase: (tx: Prisma.TransactionClient, userId: string) => Promise<number>;
  /** Id-cursor page of the user's rows; null when the entry is not exported. */
  readPage: ((userId: string, afterId: string | null, take: number) => Promise<ExportRow[]>) | null;
}

function cursor(afterId: string | null): { id: { gt: string } } | Record<string, never> {
  return afterId ? { id: { gt: afterId } } : {};
}

// Order is the erasure order. Postgres RESTRICT is not deferrable, so children that
// restrict their parent (Transaction -> Account/Category, Invoice -> Client, and every
// Work-module row -> User) must go before the parent. Adding a Prisma model without
// registering it here fails account-data.registry.test.ts.
export const ACCOUNT_DATA_REGISTRY: readonly AccountDataEntry[] = [
  {
    model: 'InvoiceLineItem',
    exportKey: null,
    erase: async (tx, userId) => (await tx.invoiceLineItem.deleteMany({ where: { invoice: { userId } } })).count,
    readPage: null,
  },
  {
    model: 'Invoice',
    exportKey: 'invoices',
    erase: async (tx, userId) => (await tx.invoice.deleteMany({ where: { userId } })).count,
    readPage: (userId, afterId, take) =>
      prisma.invoice.findMany({
        where: { userId, ...cursor(afterId) },
        include: { lineItems: { orderBy: { sortOrder: 'asc' } } },
        orderBy: { id: 'asc' },
        take,
      }),
  },
  {
    model: 'Transaction',
    exportKey: 'transactions',
    erase: async (tx, userId) => (await tx.transaction.deleteMany({ where: { userId } })).count,
    readPage: (userId, afterId, take) =>
      prisma.transaction.findMany({ where: { userId, ...cursor(afterId) }, orderBy: { id: 'asc' }, take }),
  },
  {
    model: 'WorkLog',
    exportKey: 'workLogs',
    erase: async (tx, userId) => (await tx.workLog.deleteMany({ where: { userId } })).count,
    readPage: (userId, afterId, take) =>
      prisma.workLog.findMany({ where: { userId, ...cursor(afterId) }, orderBy: { id: 'asc' }, take }),
  },
  {
    model: 'TodoItem',
    exportKey: 'todoItems',
    erase: async (tx, userId) => (await tx.todoItem.deleteMany({ where: { userId } })).count,
    readPage: (userId, afterId, take) =>
      prisma.todoItem.findMany({ where: { userId, ...cursor(afterId) }, orderBy: { id: 'asc' }, take }),
  },
  {
    model: 'Note',
    exportKey: 'notes',
    erase: async (tx, userId) => (await tx.note.deleteMany({ where: { userId } })).count,
    readPage: (userId, afterId, take) =>
      prisma.note.findMany({ where: { userId, ...cursor(afterId) }, orderBy: { id: 'asc' }, take }),
  },
  {
    model: 'Achievement',
    exportKey: 'achievements',
    erase: async (tx, userId) => (await tx.achievement.deleteMany({ where: { userId } })).count,
    readPage: (userId, afterId, take) =>
      prisma.achievement.findMany({ where: { userId, ...cursor(afterId) }, orderBy: { id: 'asc' }, take }),
  },
  {
    model: 'Task',
    exportKey: 'tasks',
    erase: async (tx, userId) => (await tx.task.deleteMany({ where: { userId } })).count,
    readPage: (userId, afterId, take) =>
      prisma.task.findMany({ where: { userId, ...cursor(afterId) }, orderBy: { id: 'asc' }, take }),
  },
  {
    model: 'Client',
    exportKey: 'clients',
    erase: async (tx, userId) => (await tx.client.deleteMany({ where: { userId } })).count,
    readPage: (userId, afterId, take) =>
      prisma.client.findMany({ where: { userId, ...cursor(afterId) }, orderBy: { id: 'asc' }, take }),
  },
  {
    model: 'Account',
    exportKey: 'accounts',
    erase: async (tx, userId) => (await tx.account.deleteMany({ where: { userId } })).count,
    readPage: (userId, afterId, take) =>
      prisma.account.findMany({ where: { userId, ...cursor(afterId) }, orderBy: { id: 'asc' }, take }),
  },
  {
    model: 'Category',
    exportKey: 'categories',
    erase: async (tx, userId) => (await tx.category.deleteMany({ where: { userId } })).count,
    readPage: (userId, afterId, take) =>
      prisma.category.findMany({ where: { userId, ...cursor(afterId) }, orderBy: { id: 'asc' }, take }),
  },
  {
    model: 'FeedbackSubmission',
    exportKey: 'feedbackSubmissions',
    erase: async (tx, userId) => (await tx.feedbackSubmission.deleteMany({ where: { userId } })).count,
    readPage: (userId, afterId, take) =>
      prisma.feedbackSubmission.findMany({ where: { userId, ...cursor(afterId) }, orderBy: { id: 'asc' }, take }),
  },
  {
    // Security artefact, not user content: erased but never exported.
    model: 'PasswordResetToken',
    exportKey: null,
    erase: async (tx, userId) => (await tx.passwordResetToken.deleteMany({ where: { userId } })).count,
    readPage: null,
  },
];

export function readExportUser(userId: string): Promise<Record<string, unknown> | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    omit: { passwordHash: true },
  });
}
