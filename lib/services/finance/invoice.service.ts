import { prisma } from '@/lib/db/prisma';
import type { Invoice, InvoiceLineItem, Client, InvoiceStatus, Account } from '@prisma/client';
import type { CreateInvoiceData } from '@/lib/schemas/finance/invoice.schema';

// Service-layer update type uses concrete types (post-Zod-parse)
interface UpdateInvoiceData {
  clientId?: string;
  paymentAccountId?: string | null;
  issueDate?: Date;
  dueDate?: Date | null;
  notes?: string | null;
  taxRate?: number;
  currency?: string;
  invoiceNumber?: string;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type PaymentAccountSummary = Pick<Account, 'id' | 'name' | 'bankName' | 'accountNumber' | 'bsb' | 'iban' | 'swiftBic'>;

export type InvoiceWithClient = Invoice & {
  client: Client;
};

export type InvoiceWithDetails = Invoice & {
  client: Client;
  paymentAccount: PaymentAccountSummary | null;
  lineItems: (InvoiceLineItem & {
    workLog: { id: string; billedAt: Date | null; description: string; timeSpent: number | null } | null;
  })[];
};

export type ResolvedStatus = InvoiceStatus | 'OVERDUE';

// ─── Status helper ─────────────────────────────────────────────────────────────

export function resolveInvoiceStatus(invoice: {
  status: InvoiceStatus | string;
  dueDate: Date | null;
}): ResolvedStatus {
  if (invoice.status === 'SENT' && invoice.dueDate && invoice.dueDate < new Date()) {
    return 'OVERDUE';
  }
  return invoice.status as ResolvedStatus;
}

// ─── Allowed status transitions ────────────────────────────────────────────────

const ALLOWED_TRANSITIONS: Partial<Record<string, InvoiceStatus[]>> = {
  DRAFT: ['SENT', 'CANCELLED'],
  SENT: ['PAID', 'DRAFT', 'CANCELLED'],
  PAID: [],
  CANCELLED: [],
};

function assertTransition(current: string, next: InvoiceStatus): void {
  const allowed = ALLOWED_TRANSITIONS[current] ?? [];
  if (!allowed.includes(next)) {
    throw new Error(`Cannot transition invoice from ${current} to ${next}`);
  }
}

// ─── Invoice number generation ─────────────────────────────────────────────────

export async function generateInvoiceNumber(userId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;

  const existing = await prisma.invoice.findMany({
    where: {
      userId,
      invoiceNumber: { startsWith: prefix },
    },
    select: { invoiceNumber: true },
    orderBy: { invoiceNumber: 'desc' },
  });

  const maxSeq = existing.reduce((max, inv) => {
    const parts = inv.invoiceNumber.split('-');
    const seq = parseInt(parts[2] ?? '0', 10);
    return Math.max(max, isNaN(seq) ? 0 : seq);
  }, 0);

  const next = maxSeq + 1;
  return `${prefix}${String(next).padStart(3, '0')}`;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getInvoices(
  userId: string,
  filters?: { status?: InvoiceStatus; clientId?: string },
): Promise<InvoiceWithClient[]> {
  return prisma.invoice.findMany({
    where: {
      userId,
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.clientId ? { clientId: filters.clientId } : {}),
    },
    include: {
      client: true,
    },
    orderBy: { issueDate: 'desc' },
  }) as Promise<InvoiceWithClient[]>;
}

export async function getInvoiceById(
  userId: string,
  id: string,
): Promise<InvoiceWithDetails | null> {
  return prisma.invoice.findFirst({
    where: { id, userId },
    include: {
      client: true,
      paymentAccount: {
        select: { id: true, name: true, bankName: true, accountNumber: true, bsb: true, iban: true, swiftBic: true },
      },
      lineItems: {
        orderBy: { sortOrder: 'asc' },
        include: {
          workLog: {
            select: {
              id: true,
              billedAt: true,
              description: true,
              timeSpent: true,
            },
          },
        },
      },
    },
  }) as Promise<InvoiceWithDetails | null>;
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createInvoice(
  userId: string,
  data: CreateInvoiceData,
): Promise<Invoice> {
  const invoiceNumber = data.invoiceNumber ?? (await generateInvoiceNumber(userId));

  return prisma.invoice.create({
    data: {
      userId,
      clientId: data.clientId,
      paymentAccountId: data.paymentAccountId ?? null,
      invoiceNumber,
      issueDate: data.issueDate,
      dueDate: data.dueDate ?? null,
      notes: data.notes ?? null,
      taxRate: data.taxRate ?? 0,
      currency: data.currency ?? 'GBP',
      status: 'DRAFT',
    },
  });
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateInvoice(
  userId: string,
  id: string,
  data: UpdateInvoiceData,
): Promise<Invoice | null> {
  const existing = await prisma.invoice.findFirst({ where: { id, userId } });
  if (!existing) return null;

  if (existing.status !== 'DRAFT') {
    throw new Error('Only DRAFT invoices can be edited');
  }

  return prisma.invoice.update({
    where: { id },
    data: {
      ...(data.clientId !== undefined ? { clientId: data.clientId } : {}),
      ...(data.issueDate !== undefined ? { issueDate: data.issueDate } : {}),
      ...(data.dueDate !== undefined ? { dueDate: data.dueDate } : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
      ...(data.taxRate !== undefined ? { taxRate: data.taxRate } : {}),
      ...(data.currency !== undefined ? { currency: data.currency } : {}),
    },
  });
}

// ─── Send ─────────────────────────────────────────────────────────────────────

export async function sendInvoice(userId: string, id: string): Promise<Invoice> {
  const existing = await prisma.invoice.findFirst({
    where: { id, userId },
    include: {
      lineItems: { select: { total: true, workLogId: true } },
    },
  });

  if (!existing) throw new Error('Invoice not found');
  assertTransition(existing.status, 'SENT');

  const subtotal = existing.lineItems.reduce((sum, li) => sum + li.total, 0);
  const taxAmount = Math.round((subtotal * existing.taxRate) / 10000);
  const total = subtotal + taxAmount;

  const workLogIds = existing.lineItems
    .map((li) => li.workLogId)
    .filter((wid): wid is string => wid !== null);

  return prisma.$transaction(async (tx) => {
    const updated = await tx.invoice.update({
      where: { id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        subtotal,
        taxAmount,
        total,
      },
    });

    if (workLogIds.length > 0) {
      await tx.workLog.updateMany({
        where: { id: { in: workLogIds } },
        data: { billedAt: new Date() },
      });
    }

    return updated;
  });
}

// ─── Mark Paid ────────────────────────────────────────────────────────────────

export async function markInvoicePaid(
  userId: string,
  id: string,
  paidAt?: Date,
): Promise<Invoice> {
  const existing = await prisma.invoice.findFirst({ where: { id, userId } });
  if (!existing) throw new Error('Invoice not found');
  assertTransition(existing.status, 'PAID');

  return prisma.invoice.update({
    where: { id },
    data: { status: 'PAID', paidAt: paidAt ?? new Date() },
  });
}

// ─── Cancel ───────────────────────────────────────────────────────────────────

export async function cancelInvoice(userId: string, id: string): Promise<Invoice> {
  const existing = await prisma.invoice.findFirst({
    where: { id, userId },
    include: {
      lineItems: { select: { workLogId: true } },
    },
  });

  if (!existing) throw new Error('Invoice not found');
  assertTransition(existing.status, 'CANCELLED');

  const workLogIds = existing.lineItems
    .map((li) => li.workLogId)
    .filter((wid): wid is string => wid !== null);

  return prisma.$transaction(async (tx) => {
    const updated = await tx.invoice.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    // If invoice was SENT, revert billedAt on linked work logs
    if (existing.status === 'SENT' && workLogIds.length > 0) {
      await tx.workLog.updateMany({
        where: { id: { in: workLogIds } },
        data: { billedAt: null },
      });
    }

    return updated;
  });
}

// ─── Revert to Draft ──────────────────────────────────────────────────────────

export async function revertToDraft(userId: string, id: string): Promise<Invoice> {
  const existing = await prisma.invoice.findFirst({
    where: { id, userId },
    include: {
      lineItems: { select: { workLogId: true } },
    },
  });

  if (!existing) throw new Error('Invoice not found');
  assertTransition(existing.status, 'DRAFT');

  const workLogIds = existing.lineItems
    .map((li) => li.workLogId)
    .filter((wid): wid is string => wid !== null);

  return prisma.$transaction(async (tx) => {
    const updated = await tx.invoice.update({
      where: { id },
      data: {
        status: 'DRAFT',
        sentAt: null,
        subtotal: 0,
        taxAmount: 0,
        total: 0,
      },
    });

    if (workLogIds.length > 0) {
      await tx.workLog.updateMany({
        where: { id: { in: workLogIds } },
        data: { billedAt: null },
      });
    }

    return updated;
  });
}

// ─── Send Payment Reminder ────────────────────────────────────────────────────

export async function sendPaymentReminder(
  userId: string,
  id: string,
): Promise<{ reminderCount: number; lastReminderAt: Date }> {
  const existing = await prisma.invoice.findFirst({ where: { id, userId } });
  if (!existing) throw new Error('Invoice not found');

  if (existing.status !== 'SENT') {
    throw new Error('Reminders can only be sent for SENT invoices');
  }

  if (!existing.dueDate || existing.dueDate >= new Date()) {
    throw new Error('Reminders can only be sent for overdue invoices');
  }

  const now = new Date();
  const updated = await prisma.invoice.update({
    where: { id },
    data: {
      reminderCount: { increment: 1 },
      lastReminderAt: now,
    },
  });

  return {
    reminderCount: updated.reminderCount,
    lastReminderAt: updated.lastReminderAt ?? now,
  };
}
