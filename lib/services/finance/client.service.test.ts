import {
  getClients,
  getClientById,
  createClient,
  updateClient,
  archiveClient,
  deleteClient,
} from './client.service';

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    client: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/db/prisma';

const mockClientFindMany = (prisma.client as jest.Mocked<typeof prisma.client>).findMany;
const mockClientFindFirst = (prisma.client as jest.Mocked<typeof prisma.client>).findFirst;
const mockClientCreate = (prisma.client as jest.Mocked<typeof prisma.client>).create;
const mockClientUpdate = (prisma.client as jest.Mocked<typeof prisma.client>).update;
const mockClientDelete = (prisma.client as jest.Mocked<typeof prisma.client>).delete;

const userId = 'user-1';
const clientId = 'client-1';

const baseClient = {
  id: clientId,
  userId,
  name: 'Acme Corp',
  email: 'billing@acme.com',
  phone: '+44 7700 900000',
  address: '1 London Road\nLondon\nE1 1AA',
  defaultRate: 7500,
  currency: 'GBP',
  notes: 'Key client',
  archivedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const baseInvoice = {
  id: 'invoice-1',
  total: 100000,
  status: 'SENT' as const,
  dueDate: new Date(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getClients', () => {
  it('returns only active (archivedAt: null) clients for the user', async () => {
    mockClientFindMany.mockResolvedValue([
      { ...baseClient, invoices: [] },
    ] as never);

    const result = await getClients(userId);

    expect(mockClientFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId, archivedAt: null } }),
    );
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Acme Corp');
  });

  it('computes totalInvoiced as sum of all invoice totals', async () => {
    mockClientFindMany.mockResolvedValue([
      {
        ...baseClient,
        invoices: [
          { total: 50000, status: 'PAID', dueDate: null },
          { total: 30000, status: 'SENT', dueDate: new Date() },
        ],
      },
    ] as never);

    const result = await getClients(userId);
    expect(result[0].totalInvoiced).toBe(80000);
  });

  it('computes totalOutstanding as sum of SENT invoice totals only', async () => {
    mockClientFindMany.mockResolvedValue([
      {
        ...baseClient,
        invoices: [
          { total: 50000, status: 'PAID', dueDate: null },
          { total: 30000, status: 'SENT', dueDate: new Date() },
          { total: 20000, status: 'DRAFT', dueDate: null },
        ],
      },
    ] as never);

    const result = await getClients(userId);
    expect(result[0].totalOutstanding).toBe(30000);
  });

  it('returns totalInvoiced and totalOutstanding as 0 when no invoices', async () => {
    mockClientFindMany.mockResolvedValue([
      { ...baseClient, invoices: [] },
    ] as never);

    const result = await getClients(userId);
    expect(result[0].totalInvoiced).toBe(0);
    expect(result[0].totalOutstanding).toBe(0);
  });
});

describe('getClientById', () => {
  it('returns client with invoices when found for user', async () => {
    const clientWithInvoices = { ...baseClient, invoices: [baseInvoice] };
    mockClientFindFirst.mockResolvedValue(clientWithInvoices as never);

    const result = await getClientById(userId, clientId);
    expect(mockClientFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: clientId, userId } }),
    );
    expect(result).toEqual(clientWithInvoices);
  });

  it('returns null when client belongs to a different user', async () => {
    mockClientFindFirst.mockResolvedValue(null);

    const result = await getClientById('other-user', clientId);
    expect(result).toBeNull();
  });

  it('returns null when client does not exist', async () => {
    mockClientFindFirst.mockResolvedValue(null);

    const result = await getClientById(userId, 'nonexistent-id');
    expect(result).toBeNull();
  });
});

describe('createClient', () => {
  it('creates and returns a client with the given userId', async () => {
    const input = { name: 'New Corp', email: 'new@corp.com' };
    mockClientCreate.mockResolvedValue({ ...baseClient, ...input } as never);

    const result = await createClient(userId, input);
    expect(mockClientCreate).toHaveBeenCalledWith({
      data: { ...input, userId },
    });
    expect(result.name).toBe('New Corp');
  });
});

describe('updateClient', () => {
  it('returns null if client not found or not owned', async () => {
    mockClientFindFirst.mockResolvedValue(null);

    const result = await updateClient(userId, clientId, { name: 'Updated' });
    expect(result).toBeNull();
    expect(mockClientUpdate).not.toHaveBeenCalled();
  });

  it('updates and returns client when found', async () => {
    mockClientFindFirst.mockResolvedValue(baseClient as never);
    const updated = { ...baseClient, name: 'Updated Corp' };
    mockClientUpdate.mockResolvedValue(updated as never);

    const result = await updateClient(userId, clientId, { name: 'Updated Corp' });
    expect(mockClientUpdate).toHaveBeenCalledWith({
      where: { id: clientId },
      data: { name: 'Updated Corp' },
    });
    expect(result?.name).toBe('Updated Corp');
  });
});

describe('archiveClient', () => {
  it('returns null if client not found', async () => {
    mockClientFindFirst.mockResolvedValue(null);

    const result = await archiveClient(userId, clientId);
    expect(result).toBeNull();
    expect(mockClientUpdate).not.toHaveBeenCalled();
  });

  it('sets archivedAt on the client', async () => {
    mockClientFindFirst.mockResolvedValue(baseClient as never);
    const archived = { ...baseClient, archivedAt: new Date() };
    mockClientUpdate.mockResolvedValue(archived as never);

    const result = await archiveClient(userId, clientId);
    expect(mockClientUpdate).toHaveBeenCalledWith({
      where: { id: clientId },
      data: { archivedAt: expect.any(Date) },
    });
    expect(result?.archivedAt).toBeInstanceOf(Date);
  });
});

describe('deleteClient', () => {
  it('throws Error("Client has invoices") if client has invoices', async () => {
    mockClientFindFirst.mockResolvedValue({
      ...baseClient,
      invoices: [{ id: 'invoice-1' }],
    } as never);

    await expect(deleteClient(userId, clientId)).rejects.toThrow('Client has invoices');
    expect(mockClientDelete).not.toHaveBeenCalled();
  });

  it('returns false if client not found or does not belong to user', async () => {
    mockClientFindFirst.mockResolvedValue(null);

    const result = await deleteClient('other-user', clientId);
    expect(result).toBe(false);
    expect(mockClientDelete).not.toHaveBeenCalled();
  });

  it('hard-deletes client and returns true when no invoices', async () => {
    mockClientFindFirst.mockResolvedValue({
      ...baseClient,
      invoices: [],
    } as never);
    mockClientDelete.mockResolvedValue(baseClient as never);

    const result = await deleteClient(userId, clientId);
    expect(mockClientDelete).toHaveBeenCalledWith({ where: { id: clientId } });
    expect(result).toBe(true);
  });
});
