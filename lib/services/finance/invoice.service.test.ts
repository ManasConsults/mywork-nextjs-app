import {
  getInvoices,
  getInvoiceById,
  createInvoice,
  generateInvoiceNumber,
  updateInvoice,
  sendInvoice,
  markInvoicePaid,
  cancelInvoice,
  revertToDraft,
  deleteInvoice,
  resolveInvoiceStatus,
  sendPaymentReminder,
} from './invoice.service';

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    invoice: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    invoiceLineItem: {
      deleteMany: jest.fn(),
    },
    workLog: {
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

import { prisma } from '@/lib/db/prisma';

const mockInvoiceFindMany = (prisma.invoice as jest.Mocked<typeof prisma.invoice>).findMany;
const mockInvoiceFindFirst = (prisma.invoice as jest.Mocked<typeof prisma.invoice>).findFirst;
const mockInvoiceCreate = (prisma.invoice as jest.Mocked<typeof prisma.invoice>).create;
const mockInvoiceUpdate = (prisma.invoice as jest.Mocked<typeof prisma.invoice>).update;
const mockPrismaTransaction = prisma.$transaction as jest.MockedFunction<typeof prisma.$transaction>;

const userId = 'user-1';
const invoiceId = 'invoice-1';
const clientId = 'client-1';
const now = new Date('2026-03-07T12:00:00Z');

const baseInvoice = {
  id: invoiceId,
  userId,
  clientId,
  paymentAccountId: null,
  invoiceNumber: 'INV-2026-001',
  status: 'DRAFT' as const,
  issueDate: now,
  dueDate: null,
  notes: null,
  taxRate: 0,
  subtotal: 0,
  taxAmount: 0,
  total: 0,
  currency: 'GBP',
  sentAt: null,
  paidAt: null,
  reminderCount: 0,
  lastReminderAt: null,
  createdAt: now,
  updatedAt: now,
};

const baseClient = {
  id: clientId,
  userId,
  name: 'Acme Ltd',
  email: null,
  phone: null,
  address: null,
  defaultRate: null,
  currency: 'GBP',
  notes: null,
  archivedAt: null,
  createdAt: now,
  updatedAt: now,
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── resolveInvoiceStatus ─────────────────────────────────────────────────────

describe('resolveInvoiceStatus', () => {
  it('returns OVERDUE when status is SENT and dueDate is in the past', () => {
    const past = new Date(Date.now() - 86400000);
    const result = resolveInvoiceStatus({ status: 'SENT', dueDate: past });
    expect(result).toBe('OVERDUE');
  });

  it('returns SENT when status is SENT and dueDate is in the future', () => {
    const future = new Date(Date.now() + 86400000);
    const result = resolveInvoiceStatus({ status: 'SENT', dueDate: future });
    expect(result).toBe('SENT');
  });

  it('returns SENT when status is SENT and dueDate is null', () => {
    const result = resolveInvoiceStatus({ status: 'SENT', dueDate: null });
    expect(result).toBe('SENT');
  });

  it('returns DRAFT for draft invoices', () => {
    const result = resolveInvoiceStatus({ status: 'DRAFT', dueDate: null });
    expect(result).toBe('DRAFT');
  });

  it('returns PAID for paid invoices', () => {
    const result = resolveInvoiceStatus({ status: 'PAID', dueDate: null });
    expect(result).toBe('PAID');
  });

  it('returns CANCELLED for cancelled invoices', () => {
    const result = resolveInvoiceStatus({ status: 'CANCELLED', dueDate: null });
    expect(result).toBe('CANCELLED');
  });
});

// ─── getInvoices ──────────────────────────────────────────────────────────────

describe('getInvoices', () => {
  it('returns only the current user\'s invoices', async () => {
    const invoiceWithClient = { ...baseInvoice, client: baseClient };
    mockInvoiceFindMany.mockResolvedValue([invoiceWithClient] as never);

    const result = await getInvoices(userId);

    expect(mockInvoiceFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ userId }) }),
    );
    expect(result).toHaveLength(1);
    expect(result[0].userId).toBe(userId);
  });

  it('filters by status when provided', async () => {
    mockInvoiceFindMany.mockResolvedValue([]);

    await getInvoices(userId, { status: 'DRAFT' });

    expect(mockInvoiceFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId, status: 'DRAFT' }),
      }),
    );
  });

  it('filters by clientId when provided', async () => {
    mockInvoiceFindMany.mockResolvedValue([]);

    await getInvoices(userId, { clientId });

    expect(mockInvoiceFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId, clientId }),
      }),
    );
  });
});

// ─── generateInvoiceNumber ────────────────────────────────────────────────────

describe('generateInvoiceNumber', () => {
  it('generates INV-YYYY-001 for first invoice of the year', async () => {
    mockInvoiceFindMany.mockResolvedValue([]);

    const result = await generateInvoiceNumber(userId);
    const year = new Date().getFullYear();

    expect(result).toBe(`INV-${year}-001`);
  });

  it('generates next sequential number when invoices exist', async () => {
    const year = new Date().getFullYear();
    mockInvoiceFindMany.mockResolvedValue([
      { invoiceNumber: `INV-${year}-001` },
      { invoiceNumber: `INV-${year}-003` },
    ] as never);

    const result = await generateInvoiceNumber(userId);

    expect(result).toBe(`INV-${year}-004`);
  });
});

// ─── getInvoiceById ───────────────────────────────────────────────────────────

describe('getInvoiceById', () => {
  it('returns null when invoice not found', async () => {
    mockInvoiceFindFirst.mockResolvedValue(null);
    const result = await getInvoiceById(userId, invoiceId);
    expect(result).toBeNull();
  });

  it('includes paymentAccount in the query', async () => {
    const invoiceWithDetails = {
      ...baseInvoice,
      client: baseClient,
      paymentAccount: null,
      lineItems: [],
    };
    mockInvoiceFindFirst.mockResolvedValue(invoiceWithDetails as never);

    await getInvoiceById(userId, invoiceId);

    expect(mockInvoiceFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          paymentAccount: expect.objectContaining({ select: expect.any(Object) }),
        }),
      }),
    );
  });

  it('returns paymentAccount details when linked', async () => {
    const paymentAccount = {
      id: 'acc-1', name: 'My Bank', bankName: 'ANZ', accountNumber: '12345678',
      bsb: '012-345', iban: null, swiftBic: null,
    };
    const invoiceWithAccount = {
      ...baseInvoice,
      paymentAccountId: 'acc-1',
      client: baseClient,
      paymentAccount,
      lineItems: [],
    };
    mockInvoiceFindFirst.mockResolvedValue(invoiceWithAccount as never);

    const result = await getInvoiceById(userId, invoiceId);

    expect(result?.paymentAccount).toEqual(paymentAccount);
  });
});

// ─── createInvoice ────────────────────────────────────────────────────────────

describe('createInvoice', () => {
  it('auto-generates invoice number if not provided', async () => {
    const year = new Date().getFullYear();
    mockInvoiceFindMany.mockResolvedValue([]);
    mockInvoiceCreate.mockResolvedValue({ ...baseInvoice, invoiceNumber: `INV-${year}-001` } as never);

    const result = await createInvoice(userId, {
      clientId,
      issueDate: now,
      taxRate: 0,
      currency: 'GBP',
    });

    expect(mockInvoiceCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          invoiceNumber: `INV-${year}-001`,
          status: 'DRAFT',
          userId,
          clientId,
        }),
      }),
    );
    expect(result.invoiceNumber).toMatch(/^INV-\d{4}-\d{3}$/);
  });

  it('uses provided invoice number when given', async () => {
    mockInvoiceCreate.mockResolvedValue({ ...baseInvoice, invoiceNumber: 'INV-CUSTOM-001' } as never);

    await createInvoice(userId, {
      clientId,
      issueDate: now,
      invoiceNumber: 'INV-CUSTOM-001',
      taxRate: 0,
      currency: 'GBP',
    });

    expect(mockInvoiceCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ invoiceNumber: 'INV-CUSTOM-001' }),
      }),
    );
    // generateInvoiceNumber should NOT have been called (no findMany for numbers)
    expect(mockInvoiceFindMany).not.toHaveBeenCalled();
  });

  it('persists paymentAccountId when provided', async () => {
    const paymentAccountId = 'acc-1';
    mockInvoiceFindMany.mockResolvedValue([]);
    mockInvoiceCreate.mockResolvedValue({ ...baseInvoice, paymentAccountId } as never);

    await createInvoice(userId, {
      clientId,
      issueDate: now,
      taxRate: 0,
      currency: 'GBP',
      paymentAccountId,
    });

    expect(mockInvoiceCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ paymentAccountId }),
      }),
    );
  });

  it('sets paymentAccountId to null when not provided', async () => {
    mockInvoiceFindMany.mockResolvedValue([]);
    mockInvoiceCreate.mockResolvedValue(baseInvoice as never);

    await createInvoice(userId, {
      clientId,
      issueDate: now,
      taxRate: 0,
      currency: 'GBP',
    });

    expect(mockInvoiceCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ paymentAccountId: null }),
      }),
    );
  });
});

// ─── sendInvoice ──────────────────────────────────────────────────────────────

describe('sendInvoice', () => {
  it('freezes totals correctly: subtotal + tax + total', async () => {
    const invoiceWithItems = {
      ...baseInvoice,
      status: 'DRAFT' as const,
      taxRate: 2000, // 20%
      lineItems: [
        { total: 10000, workLogId: null },
        { total: 5000, workLogId: null },
      ],
    };

    const sentInvoice = {
      ...baseInvoice,
      status: 'SENT' as const,
      subtotal: 15000,
      taxAmount: 3000,
      total: 18000,
      sentAt: new Date(),
    };

    mockInvoiceFindFirst.mockResolvedValue(invoiceWithItems as never);

    mockPrismaTransaction.mockImplementation(async (fn) => {
      const tx = {
        invoice: { update: jest.fn().mockResolvedValue(sentInvoice) },
        workLog: { updateMany: jest.fn() },
      };
      return fn(tx as never);
    });

    const result = await sendInvoice(userId, invoiceId);

    expect(result.status).toBe('SENT');
    expect(result.subtotal).toBe(15000);
    expect(result.taxAmount).toBe(3000);
    expect(result.total).toBe(18000);
  });

  it('throws when invoice is not in DRAFT status', async () => {
    mockInvoiceFindFirst.mockResolvedValue({
      ...baseInvoice,
      status: 'PAID' as const,
      lineItems: [],
    } as never);

    await expect(sendInvoice(userId, invoiceId)).rejects.toThrow(
      'Cannot transition invoice from PAID to SENT',
    );
  });

  it('throws when invoice not found', async () => {
    mockInvoiceFindFirst.mockResolvedValue(null);

    await expect(sendInvoice(userId, invoiceId)).rejects.toThrow('Invoice not found');
  });

  it('marks linked work logs as billed', async () => {
    const workLogId = 'wl-1';
    const invoiceWithItems = {
      ...baseInvoice,
      status: 'DRAFT' as const,
      taxRate: 0,
      lineItems: [{ total: 5000, workLogId }],
    };

    const sentInvoice = { ...baseInvoice, status: 'SENT' as const };
    mockInvoiceFindFirst.mockResolvedValue(invoiceWithItems as never);

    const mockWorkLogUpdateMany = jest.fn().mockResolvedValue({ count: 1 });
    mockPrismaTransaction.mockImplementation(async (fn) => {
      const tx = {
        invoice: { update: jest.fn().mockResolvedValue(sentInvoice) },
        workLog: { updateMany: mockWorkLogUpdateMany },
      };
      return fn(tx as never);
    });

    await sendInvoice(userId, invoiceId);

    expect(mockWorkLogUpdateMany).toHaveBeenCalledWith({
      where: { id: { in: [workLogId] } },
      data: { billedAt: expect.any(Date) },
    });
  });
});

// ─── markInvoicePaid ─────────────────────────────────────────────────────────

describe('markInvoicePaid', () => {
  it('transitions SENT → PAID and sets paidAt', async () => {
    const sentInvoice = { ...baseInvoice, status: 'SENT' as const };
    const paidInvoice = { ...baseInvoice, status: 'PAID' as const, paidAt: new Date() };

    mockInvoiceFindFirst.mockResolvedValue(sentInvoice as never);
    mockInvoiceUpdate.mockResolvedValue(paidInvoice as never);

    const result = await markInvoicePaid(userId, invoiceId);

    expect(mockInvoiceUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'PAID', paidAt: expect.any(Date) }),
      }),
    );
    expect(result.status).toBe('PAID');
  });

  it('throws when invoice is not SENT', async () => {
    mockInvoiceFindFirst.mockResolvedValue({ ...baseInvoice, status: 'DRAFT' as const } as never);

    await expect(markInvoicePaid(userId, invoiceId)).rejects.toThrow(
      'Cannot transition invoice from DRAFT to PAID',
    );
  });
});

// ─── cancelInvoice ────────────────────────────────────────────────────────────

describe('cancelInvoice', () => {
  it('cancels a DRAFT invoice without touching work logs', async () => {
    const draftInvoice = { ...baseInvoice, status: 'DRAFT' as const, lineItems: [] };
    const cancelledInvoice = { ...baseInvoice, status: 'CANCELLED' as const };

    mockInvoiceFindFirst.mockResolvedValue(draftInvoice as never);

    const mockWorkLogUpdateMany = jest.fn();
    mockPrismaTransaction.mockImplementation(async (fn) => {
      const tx = {
        invoice: { update: jest.fn().mockResolvedValue(cancelledInvoice) },
        workLog: { updateMany: mockWorkLogUpdateMany },
      };
      return fn(tx as never);
    });

    const result = await cancelInvoice(userId, invoiceId);

    expect(result.status).toBe('CANCELLED');
    expect(mockWorkLogUpdateMany).not.toHaveBeenCalled();
  });

  it('reverts billed work logs when cancelling a SENT invoice', async () => {
    const workLogId = 'wl-1';
    const sentInvoice = {
      ...baseInvoice,
      status: 'SENT' as const,
      lineItems: [{ workLogId }],
    };
    const cancelledInvoice = { ...baseInvoice, status: 'CANCELLED' as const };

    mockInvoiceFindFirst.mockResolvedValue(sentInvoice as never);

    const mockWorkLogUpdateMany = jest.fn().mockResolvedValue({ count: 1 });
    mockPrismaTransaction.mockImplementation(async (fn) => {
      const tx = {
        invoice: { update: jest.fn().mockResolvedValue(cancelledInvoice) },
        workLog: { updateMany: mockWorkLogUpdateMany },
      };
      return fn(tx as never);
    });

    await cancelInvoice(userId, invoiceId);

    expect(mockWorkLogUpdateMany).toHaveBeenCalledWith({
      where: { id: { in: [workLogId] } },
      data: { billedAt: null },
    });
  });

  it('throws when invoice is PAID', async () => {
    mockInvoiceFindFirst.mockResolvedValue({ ...baseInvoice, status: 'PAID' as const, lineItems: [] } as never);

    await expect(cancelInvoice(userId, invoiceId)).rejects.toThrow(
      'Cannot transition invoice from PAID to CANCELLED',
    );
  });
});

// ─── revertToDraft ────────────────────────────────────────────────────────────

describe('revertToDraft', () => {
  it('clears sentAt and resets frozen totals to 0', async () => {
    const sentInvoice = {
      ...baseInvoice,
      status: 'SENT' as const,
      sentAt: now,
      subtotal: 15000,
      taxAmount: 3000,
      total: 18000,
      lineItems: [],
    };

    const draftInvoice = {
      ...baseInvoice,
      status: 'DRAFT' as const,
      sentAt: null,
      subtotal: 0,
      taxAmount: 0,
      total: 0,
    };

    mockInvoiceFindFirst.mockResolvedValue(sentInvoice as never);

    mockPrismaTransaction.mockImplementation(async (fn) => {
      const tx = {
        invoice: { update: jest.fn().mockResolvedValue(draftInvoice) },
        workLog: { updateMany: jest.fn() },
      };
      return fn(tx as never);
    });

    const result = await revertToDraft(userId, invoiceId);

    expect(result.status).toBe('DRAFT');
    expect(result.sentAt).toBeNull();
    expect(result.subtotal).toBe(0);
  });

  it('throws when invoice is PAID', async () => {
    mockInvoiceFindFirst.mockResolvedValue({
      ...baseInvoice,
      status: 'PAID' as const,
      lineItems: [],
    } as never);

    await expect(revertToDraft(userId, invoiceId)).rejects.toThrow(
      'Cannot transition invoice from PAID to DRAFT',
    );
  });
});

// ─── deleteInvoice ────────────────────────────────────────────────────────────

describe('deleteInvoice', () => {
  it('throws when invoice not found', async () => {
    mockInvoiceFindFirst.mockResolvedValue(null);

    await expect(deleteInvoice(userId, invoiceId)).rejects.toThrow('Invoice not found');
  });

  it('throws when invoice is not CANCELLED', async () => {
    mockInvoiceFindFirst.mockResolvedValue({ ...baseInvoice, status: 'DRAFT' as const } as never);

    await expect(deleteInvoice(userId, invoiceId)).rejects.toThrow(
      'Only cancelled invoices can be deleted',
    );
  });

  it('throws when invoice is SENT', async () => {
    mockInvoiceFindFirst.mockResolvedValue({ ...baseInvoice, status: 'SENT' as const } as never);

    await expect(deleteInvoice(userId, invoiceId)).rejects.toThrow(
      'Only cancelled invoices can be deleted',
    );
  });

  it('throws when invoice is PAID', async () => {
    mockInvoiceFindFirst.mockResolvedValue({ ...baseInvoice, status: 'PAID' as const } as never);

    await expect(deleteInvoice(userId, invoiceId)).rejects.toThrow(
      'Only cancelled invoices can be deleted',
    );
  });

  it('deletes line items and invoice in a transaction', async () => {
    const cancelledInvoice = { ...baseInvoice, status: 'CANCELLED' as const };
    mockInvoiceFindFirst.mockResolvedValue(cancelledInvoice as never);

    const mockLineItemDeleteMany = jest.fn().mockResolvedValue({ count: 2 });
    const mockInvoiceDelete = jest.fn().mockResolvedValue(cancelledInvoice);

    mockPrismaTransaction.mockImplementation(async (fn) => {
      const tx = {
        invoiceLineItem: { deleteMany: mockLineItemDeleteMany },
        invoice: { delete: mockInvoiceDelete },
      };
      return fn(tx as never);
    });

    await deleteInvoice(userId, invoiceId);

    expect(mockLineItemDeleteMany).toHaveBeenCalledWith({ where: { invoiceId } });
    expect(mockInvoiceDelete).toHaveBeenCalledWith({ where: { id: invoiceId } });
  });

  it('scopes the lookup to the current user', async () => {
    mockInvoiceFindFirst.mockResolvedValue(null);

    await expect(deleteInvoice(userId, invoiceId)).rejects.toThrow('Invoice not found');

    expect(mockInvoiceFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ userId }) }),
    );
  });
});

// ─── updateInvoice ────────────────────────────────────────────────────────────

describe('updateInvoice', () => {
  it('returns null when invoice not found', async () => {
    mockInvoiceFindFirst.mockResolvedValue(null);


    const result = await updateInvoice(userId, invoiceId, { notes: 'updated' });

    expect(result).toBeNull();
    expect(mockInvoiceUpdate).not.toHaveBeenCalled();
  });

  it('throws when invoice is not DRAFT', async () => {
    mockInvoiceFindFirst.mockResolvedValue({ ...baseInvoice, status: 'SENT' as const } as never);



    await expect(updateInvoice(userId, invoiceId, { notes: 'x' })).rejects.toThrow(
      'Only DRAFT invoices can be edited',
    );
    expect(mockInvoiceUpdate).not.toHaveBeenCalled();
  });

  it('updates a DRAFT invoice successfully', async () => {
    mockInvoiceFindFirst.mockResolvedValue({ ...baseInvoice, status: 'DRAFT' as const } as never);
    const updated = { ...baseInvoice, notes: 'updated note' };
    mockInvoiceUpdate.mockResolvedValue(updated as never);


    const result = await updateInvoice(userId, invoiceId, { notes: 'updated note' });

    expect(mockInvoiceUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: invoiceId }, data: expect.objectContaining({ notes: 'updated note' }) }),
    );
    expect(result?.notes).toBe('updated note');
  });
});

// ─── revertToDraft with work log IDs ─────────────────────────────────────────

describe('revertToDraft (with linked work logs)', () => {
  it('clears billedAt on linked work logs when reverting a SENT invoice', async () => {
    const workLogId = 'wl-1';
    const sentInvoice = {
      ...baseInvoice,
      status: 'SENT' as const,
      lineItems: [{ workLogId }],
    };
    const draftInvoice = { ...baseInvoice, status: 'DRAFT' as const, sentAt: null, subtotal: 0, taxAmount: 0, total: 0 };

    mockInvoiceFindFirst.mockResolvedValue(sentInvoice as never);

    const mockWorkLogUpdateMany = jest.fn().mockResolvedValue({ count: 1 });
    mockPrismaTransaction.mockImplementation(async (fn) => {
      const tx = {
        invoice: { update: jest.fn().mockResolvedValue(draftInvoice) },
        workLog: { updateMany: mockWorkLogUpdateMany },
      };
      return fn(tx as never);
    });

    await revertToDraft(userId, invoiceId);

    expect(mockWorkLogUpdateMany).toHaveBeenCalledWith({
      where: { id: { in: [workLogId] } },
      data: { billedAt: null },
    });
  });

  it('does not call workLog.updateMany when no linked work logs', async () => {
    const sentInvoice = {
      ...baseInvoice,
      status: 'SENT' as const,
      lineItems: [{ workLogId: null }],
    };
    const draftInvoice = { ...baseInvoice, status: 'DRAFT' as const, sentAt: null, subtotal: 0, taxAmount: 0, total: 0 };

    mockInvoiceFindFirst.mockResolvedValue(sentInvoice as never);

    const mockWorkLogUpdateMany = jest.fn();
    mockPrismaTransaction.mockImplementation(async (fn) => {
      const tx = {
        invoice: { update: jest.fn().mockResolvedValue(draftInvoice) },
        workLog: { updateMany: mockWorkLogUpdateMany },
      };
      return fn(tx as never);
    });

    await revertToDraft(userId, invoiceId);

    expect(mockWorkLogUpdateMany).not.toHaveBeenCalled();
  });

  it('throws when invoice not found', async () => {
    mockInvoiceFindFirst.mockResolvedValue(null);

    await expect(revertToDraft(userId, invoiceId)).rejects.toThrow('Invoice not found');
  });
});

// ─── sendPaymentReminder ──────────────────────────────────────────────────────

describe('sendPaymentReminder', () => {
  it('throws when invoice not found', async () => {
    mockInvoiceFindFirst.mockResolvedValue(null);


    await expect(sendPaymentReminder(userId, invoiceId)).rejects.toThrow('Invoice not found');
  });

  it('throws when invoice is not SENT', async () => {
    mockInvoiceFindFirst.mockResolvedValue({ ...baseInvoice, status: 'DRAFT' as const } as never);


    await expect(sendPaymentReminder(userId, invoiceId)).rejects.toThrow(
      'Reminders can only be sent for SENT invoices',
    );
  });

  it('throws when invoice is SENT but not yet overdue (dueDate in future)', async () => {
    const future = new Date(Date.now() + 86400000 * 7);
    mockInvoiceFindFirst.mockResolvedValue({
      ...baseInvoice,
      status: 'SENT' as const,
      dueDate: future,
    } as never);


    await expect(sendPaymentReminder(userId, invoiceId)).rejects.toThrow(
      'Reminders can only be sent for overdue invoices',
    );
  });

  it('throws when invoice is SENT but has no dueDate', async () => {
    mockInvoiceFindFirst.mockResolvedValue({
      ...baseInvoice,
      status: 'SENT' as const,
      dueDate: null,
    } as never);


    await expect(sendPaymentReminder(userId, invoiceId)).rejects.toThrow(
      'Reminders can only be sent for overdue invoices',
    );
  });

  it('increments reminderCount and sets lastReminderAt for an overdue SENT invoice', async () => {
    const pastDue = new Date(Date.now() - 86400000 * 3);
    mockInvoiceFindFirst.mockResolvedValue({
      ...baseInvoice,
      status: 'SENT' as const,
      dueDate: pastDue,
    } as never);

    const updatedAt = new Date();
    mockInvoiceUpdate.mockResolvedValue({
      ...baseInvoice,
      status: 'SENT' as const,
      reminderCount: 1,
      lastReminderAt: updatedAt,
    } as never);


    const result = await sendPaymentReminder(userId, invoiceId);

    expect(mockInvoiceUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: invoiceId },
        data: expect.objectContaining({ reminderCount: { increment: 1 } }),
      }),
    );
    expect(result.reminderCount).toBe(1);
    expect(result.lastReminderAt).toEqual(updatedAt);
  });

  it('falls back to now when lastReminderAt is null on the updated record', async () => {
    const pastDue = new Date(Date.now() - 86400000 * 3);
    mockInvoiceFindFirst.mockResolvedValue({
      ...baseInvoice,
      status: 'SENT' as const,
      dueDate: pastDue,
    } as never);

    mockInvoiceUpdate.mockResolvedValue({
      ...baseInvoice,
      status: 'SENT' as const,
      reminderCount: 1,
      lastReminderAt: null,
    } as never);


    const result = await sendPaymentReminder(userId, invoiceId);

    expect(result.lastReminderAt).toBeInstanceOf(Date);
  });
});

// ─── assertTransition fallback branch (unknown current status → ?? []) ────────

describe('assertTransition fallback — unknown status key', () => {
  it('throws when current status is an unknown value (uses ?? [] fallback)', async () => {
    // Give an invoice with a status value not present in ALLOWED_TRANSITIONS
    mockInvoiceFindFirst.mockResolvedValue({
      ...baseInvoice,
      status: 'UNKNOWN_STATUS' as never,
    } as never);

    await expect(markInvoicePaid(userId, invoiceId)).rejects.toThrow(
      'Cannot transition invoice from UNKNOWN_STATUS to PAID',
    );
  });
});

// ─── generateInvoiceNumber — isNaN branch ────────────────────────────────────

describe('generateInvoiceNumber — isNaN branch', () => {
  it('treats non-numeric sequence as 0 when invoice number has non-numeric part', async () => {
    const year = new Date().getFullYear();
    mockInvoiceFindMany.mockResolvedValue([
      { invoiceNumber: `INV-${year}-ABC` }, // parts[2] = 'ABC' → isNaN → 0
      { invoiceNumber: `INV-${year}-005` },
    ] as never);

    const result = await generateInvoiceNumber(userId);

    expect(result).toBe(`INV-${year}-006`);
  });
});

// ─── createInvoice — default taxRate and currency branches ───────────────────

describe('createInvoice — default field branches', () => {
  it('applies taxRate=0 default when not provided', async () => {
    mockInvoiceFindMany.mockResolvedValue([]);
    mockInvoiceCreate.mockResolvedValue({ ...baseInvoice, taxRate: 0 } as never);

    await createInvoice(userId, { clientId, issueDate: now, currency: 'GBP', taxRate: 0 });

    expect(mockInvoiceCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ taxRate: 0 }),
      }),
    );
  });

  it('applies currency=GBP default when not provided', async () => {
    mockInvoiceFindMany.mockResolvedValue([]);
    mockInvoiceCreate.mockResolvedValue({ ...baseInvoice } as never);

    await createInvoice(userId, { clientId, issueDate: now, taxRate: 0, currency: 'GBP' });

    expect(mockInvoiceCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ currency: 'GBP' }),
      }),
    );
  });
});

// ─── updateInvoice — optional field spread branches ──────────────────────────

describe('updateInvoice — optional field spreads', () => {
  it('includes all provided optional fields in the update data', async () => {
    mockInvoiceFindFirst.mockResolvedValue({ ...baseInvoice, status: 'DRAFT' as const } as never);
    const updated = { ...baseInvoice, taxRate: 2000, currency: 'USD' };
    mockInvoiceUpdate.mockResolvedValue(updated as never);

    const issueDate = new Date('2026-04-01');
    const dueDate = new Date('2026-04-30');
    const result = await updateInvoice(userId, invoiceId, {
      clientId,
      issueDate,
      dueDate,
      notes: 'test note',
      taxRate: 2000,
      currency: 'USD',
    });

    expect(mockInvoiceUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          clientId,
          issueDate,
          dueDate,
          notes: 'test note',
          taxRate: 2000,
          currency: 'USD',
        }),
      }),
    );
    expect(result?.currency).toBe('USD');
  });
});

// ─── markInvoicePaid — explicit paidAt branch ────────────────────────────────

describe('markInvoicePaid — explicit paidAt', () => {
  it('uses the provided paidAt date instead of new Date()', async () => {
    const sentInvoice = { ...baseInvoice, status: 'SENT' as const };
    const explicitPaidAt = new Date('2026-03-15T10:00:00Z');
    const paidInvoice = { ...baseInvoice, status: 'PAID' as const, paidAt: explicitPaidAt };

    mockInvoiceFindFirst.mockResolvedValue(sentInvoice as never);
    mockInvoiceUpdate.mockResolvedValue(paidInvoice as never);

    const result = await markInvoicePaid(userId, invoiceId, explicitPaidAt);

    expect(mockInvoiceUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ paidAt: explicitPaidAt }),
      }),
    );
    expect(result.paidAt).toEqual(explicitPaidAt);
  });

  it('throws when invoice not found', async () => {
    mockInvoiceFindFirst.mockResolvedValue(null);

    await expect(markInvoicePaid(userId, invoiceId)).rejects.toThrow('Invoice not found');
  });
});

// ─── cancelInvoice — not found ────────────────────────────────────────────────

describe('cancelInvoice — not found', () => {
  it('throws when invoice not found', async () => {
    mockInvoiceFindFirst.mockResolvedValue(null);

    await expect(cancelInvoice(userId, invoiceId)).rejects.toThrow('Invoice not found');
  });
});
