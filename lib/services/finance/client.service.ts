import { prisma } from '@/lib/db/prisma';
import type { Client, Invoice } from '@prisma/client';
import type { CreateClientInput, UpdateClientInput } from '@/lib/schemas/finance/client.schema';

export type ClientWithTotals = Client & {
  totalInvoiced: number;
  totalOutstanding: number;
};

export type ClientWithInvoices = Client & {
  invoices: Invoice[];
};

export async function getClients(userId: string): Promise<ClientWithTotals[]> {
  const clients = await prisma.client.findMany({
    where: { userId, archivedAt: null },
    orderBy: { name: 'asc' },
    include: {
      invoices: {
        select: {
          total: true,
          status: true,
          dueDate: true,
        },
      },
    },
  });

  return clients.map((client) => {
    let totalInvoiced = 0;
    let totalOutstanding = 0;

    for (const invoice of client.invoices) {
      totalInvoiced += invoice.total;
      // Outstanding = SENT invoices (OVERDUE is derived — SENT invoices past dueDate)
      if (invoice.status === 'SENT') {
        totalOutstanding += invoice.total;
      }
    }

    const { invoices: _invoices, ...clientData } = client;
    return { ...clientData, totalInvoiced, totalOutstanding };
  });
}

export async function getClientById(
  userId: string,
  id: string,
): Promise<ClientWithInvoices | null> {
  return prisma.client.findFirst({
    where: { id, userId },
    include: { invoices: true },
  });
}

export async function createClient(
  userId: string,
  data: CreateClientInput,
): Promise<Client> {
  return prisma.client.create({ data: { ...data, userId } });
}

export async function updateClient(
  userId: string,
  id: string,
  data: UpdateClientInput,
): Promise<Client | null> {
  const existing = await prisma.client.findFirst({ where: { id, userId } });
  if (!existing) return null;
  return prisma.client.update({ where: { id }, data });
}

export async function archiveClient(
  userId: string,
  id: string,
): Promise<Client | null> {
  const existing = await prisma.client.findFirst({ where: { id, userId } });
  if (!existing) return null;
  return prisma.client.update({ where: { id }, data: { archivedAt: new Date() } });
}

export async function deleteClient(
  userId: string,
  id: string,
): Promise<boolean> {
  const existing = await prisma.client.findFirst({
    where: { id, userId },
    include: { invoices: { select: { id: true }, take: 1 } },
  });

  if (!existing) return false;

  if (existing.invoices.length > 0) {
    throw new Error('Client has invoices');
  }

  await prisma.client.delete({ where: { id } });
  return true;
}
