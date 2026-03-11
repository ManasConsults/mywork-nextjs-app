import { prisma } from '@/lib/db/prisma';
import type { InvoiceLineItem } from '@prisma/client';
import type { CreateLineItemInput, UpdateLineItemInput } from '@/lib/schemas/finance/line-item.schema';

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getLineItems(
  userId: string,
  invoiceId: string,
): Promise<InvoiceLineItem[]> {
  // Validate invoice belongs to user
  const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, userId } });
  if (!invoice) throw new Error('Invoice not found');

  return prisma.invoiceLineItem.findMany({
    where: { invoiceId },
    orderBy: { sortOrder: 'asc' },
  });
}

// ─── Add line item ────────────────────────────────────────────────────────────

export async function addLineItem(
  userId: string,
  invoiceId: string,
  data: CreateLineItemInput,
): Promise<InvoiceLineItem> {
  const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, userId } });
  if (!invoice) throw new Error('Invoice not found');
  if (invoice.status !== 'DRAFT') throw new Error('Only DRAFT invoices can be edited');

  const total = Math.round(data.quantity * data.unitPrice);

  return prisma.invoiceLineItem.create({
    data: {
      invoiceId,
      description: data.description,
      quantity: data.quantity,
      unitPrice: data.unitPrice,
      total,
      sortOrder: data.sortOrder ?? 0,
    },
  });
}

// ─── Add line items from work logs ────────────────────────────────────────────

export async function addLineItemsFromWorkLogs(
  userId: string,
  invoiceId: string,
  workLogIds: string[],
  unitPrice: number,
): Promise<InvoiceLineItem[]> {
  const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, userId } });
  if (!invoice) throw new Error('Invoice not found');
  if (invoice.status !== 'DRAFT') throw new Error('Only DRAFT invoices can be edited');

  const workLogs = await prisma.workLog.findMany({
    where: {
      id: { in: workLogIds },
      userId,
    },
    select: {
      id: true,
      description: true,
      timeSpent: true,
    },
  });

  if (workLogs.length === 0) return [];

  return prisma.$transaction(async (tx) => {
    const created: InvoiceLineItem[] = [];

    for (const wl of workLogs) {
      // timeSpent is in minutes — convert to hours, rounded to 2dp
      const hours = wl.timeSpent != null ? Math.round((wl.timeSpent / 60) * 100) / 100 : 1;
      const total = Math.round(hours * unitPrice);

      const lineItem = await tx.invoiceLineItem.create({
        data: {
          invoiceId,
          description: wl.description,
          quantity: hours,
          unitPrice,
          total,
          sortOrder: 0,
          workLogId: wl.id,
        },
      });

      created.push(lineItem);
    }

    return created;
  });
}

// ─── Update line item ─────────────────────────────────────────────────────────

export async function updateLineItem(
  userId: string,
  invoiceId: string,
  lineItemId: string,
  data: UpdateLineItemInput,
): Promise<InvoiceLineItem | null> {
  const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, userId } });
  if (!invoice) return null;
  if (invoice.status !== 'DRAFT') throw new Error('Only DRAFT invoices can be edited');

  const existing = await prisma.invoiceLineItem.findFirst({
    where: { id: lineItemId, invoiceId },
  });
  if (!existing) return null;

  // Recompute total if quantity or unitPrice changed
  const newQuantity = data.quantity ?? Number(existing.quantity);
  const newUnitPrice = data.unitPrice ?? existing.unitPrice;
  const total = Math.round(newQuantity * newUnitPrice);

  return prisma.invoiceLineItem.update({
    where: { id: lineItemId },
    data: {
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.quantity !== undefined ? { quantity: data.quantity } : {}),
      ...(data.unitPrice !== undefined ? { unitPrice: data.unitPrice } : {}),
      ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
      total,
    },
  });
}

// ─── Delete line item ─────────────────────────────────────────────────────────

export async function deleteLineItem(
  userId: string,
  invoiceId: string,
  lineItemId: string,
): Promise<boolean> {
  const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, userId } });
  if (!invoice) return false;
  if (invoice.status !== 'DRAFT') throw new Error('Only DRAFT invoices can be edited');

  const existing = await prisma.invoiceLineItem.findFirst({
    where: { id: lineItemId, invoiceId },
  });
  if (!existing) return false;

  return prisma.$transaction(async (tx) => {
    await tx.invoiceLineItem.delete({ where: { id: lineItemId } });

    if (existing.workLogId) {
      await tx.workLog.update({
        where: { id: existing.workLogId },
        data: { billedAt: null },
      });
    }

    return true;
  });
}

// ─── Internal: revert billed work logs ────────────────────────────────────────

export async function revertBilledWorkLogs(invoiceId: string): Promise<void> {
  const lineItems = await prisma.invoiceLineItem.findMany({
    where: { invoiceId },
    select: { workLogId: true },
  });

  const workLogIds = lineItems
    .map((li) => li.workLogId)
    .filter((id): id is string => id !== null);

  if (workLogIds.length > 0) {
    await prisma.workLog.updateMany({
      where: { id: { in: workLogIds } },
      data: { billedAt: null },
    });
  }
}
