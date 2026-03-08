import {
  createInvoiceAction,
  updateInvoiceAction,
  cancelInvoiceAction,
  deleteInvoiceAction,
} from './invoice';

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth/auth', () => ({ authOptions: {} }));
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('@/lib/email/notifications', () => ({
  sendInvoiceEmail: jest.fn(),
  sendPaymentReminderEmail: jest.fn(),
}));
jest.mock('@/lib/pdf/generateInvoicePdf', () => ({
  fetchAndGeneratePdfBuffer: jest.fn(),
}));
jest.mock('@/lib/services/finance/invoice.service', () => ({
  createInvoice: jest.fn(),
  updateInvoice: jest.fn(),
  sendInvoice: jest.fn(),
  markInvoicePaid: jest.fn(),
  cancelInvoice: jest.fn(),
  revertToDraft: jest.fn(),
  sendPaymentReminder: jest.fn(),
  deleteInvoice: jest.fn(),
  getInvoiceById: jest.fn(),
  generateInvoiceNumber: jest.fn(),
}));

import { getServerSession } from 'next-auth';
import {
  createInvoice,
  updateInvoice,
  cancelInvoice,
  deleteInvoice,
  getInvoiceById,
} from '@/lib/services/finance/invoice.service';

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockCreateInvoice = createInvoice as jest.MockedFunction<typeof createInvoice>;
const mockUpdateInvoice = updateInvoice as jest.MockedFunction<typeof updateInvoice>;
const mockCancelInvoice = cancelInvoice as jest.MockedFunction<typeof cancelInvoice>;
const mockDeleteInvoice = deleteInvoice as jest.MockedFunction<typeof deleteInvoice>;
const mockGetInvoiceById = getInvoiceById as jest.MockedFunction<typeof getInvoiceById>;

const session = { user: { id: 'user-1', role: 'MEMBER', currency: 'GBP' }, expires: '' };
const invoiceId = 'inv-1';
const clientId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
const now = new Date('2026-03-07T12:00:00Z');

const baseInvoice = {
  id: invoiceId,
  userId: 'user-1',
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

const validCreateInput = {
  clientId,
  issueDate: now,
  taxRate: 0,
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── createInvoiceAction ──────────────────────────────────────────────────────

describe('createInvoiceAction', () => {
  it('returns error when not signed in', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const result = await createInvoiceAction(validCreateInput);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.message).toBe('You must be signed in.');
    expect(mockCreateInvoice).not.toHaveBeenCalled();
  });

  it('returns validation error on missing clientId', async () => {
    mockGetServerSession.mockResolvedValue(session as never);
    const result = await createInvoiceAction({ issueDate: now, taxRate: 0 } as never);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.fields).toBeDefined();
    expect(mockCreateInvoice).not.toHaveBeenCalled();
  });

  it('creates invoice successfully', async () => {
    mockGetServerSession.mockResolvedValue(session as never);
    mockCreateInvoice.mockResolvedValue(baseInvoice);

    const result = await createInvoiceAction(validCreateInput);

    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual(baseInvoice);
    expect(mockCreateInvoice).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ clientId, currency: 'GBP' }),
    );
  });
});

// ─── updateInvoiceAction ──────────────────────────────────────────────────────

describe('updateInvoiceAction', () => {
  it('returns error when not signed in', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const result = await updateInvoiceAction(invoiceId, {});
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.message).toBe('You must be signed in.');
  });

  it('returns error when invoice not found', async () => {
    mockGetServerSession.mockResolvedValue(session as never);
    mockUpdateInvoice.mockResolvedValue(null);
    const result = await updateInvoiceAction(invoiceId, {});
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.message).toBe('Invoice not found.');
  });

  it('returns success with updated invoice', async () => {
    mockGetServerSession.mockResolvedValue(session as never);
    mockUpdateInvoice.mockResolvedValue({ ...baseInvoice, notes: 'Updated' });
    const result = await updateInvoiceAction(invoiceId, { notes: 'Updated' });
    expect(result.success).toBe(true);
  });

  it('propagates service error message', async () => {
    mockGetServerSession.mockResolvedValue(session as never);
    mockUpdateInvoice.mockRejectedValue(new Error('Only DRAFT invoices can be edited'));
    const result = await updateInvoiceAction(invoiceId, {});
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.message).toBe('Only DRAFT invoices can be edited');
  });
});

// ─── cancelInvoiceAction ──────────────────────────────────────────────────────

describe('cancelInvoiceAction', () => {
  it('returns error when not signed in', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const result = await cancelInvoiceAction(invoiceId);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.message).toBe('You must be signed in.');
  });

  it('cancels invoice and returns success', async () => {
    mockGetServerSession.mockResolvedValue(session as never);
    mockCancelInvoice.mockResolvedValue({ ...baseInvoice, status: 'CANCELLED' });
    const result = await cancelInvoiceAction(invoiceId);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.status).toBe('CANCELLED');
  });

  it('propagates service error message', async () => {
    mockGetServerSession.mockResolvedValue(session as never);
    mockCancelInvoice.mockRejectedValue(new Error('Cannot transition invoice from PAID to CANCELLED'));
    const result = await cancelInvoiceAction(invoiceId);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe('Cannot transition invoice from PAID to CANCELLED');
    }
  });
});

// ─── deleteInvoiceAction ──────────────────────────────────────────────────────

describe('deleteInvoiceAction', () => {
  it('returns error when not signed in', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const result = await deleteInvoiceAction(invoiceId);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.message).toBe('You must be signed in.');
    expect(mockDeleteInvoice).not.toHaveBeenCalled();
  });

  it('calls deleteInvoice with userId and id', async () => {
    mockGetServerSession.mockResolvedValue(session as never);
    mockDeleteInvoice.mockResolvedValue(undefined);
    await deleteInvoiceAction(invoiceId);
    expect(mockDeleteInvoice).toHaveBeenCalledWith('user-1', invoiceId);
  });

  it('returns success when deleted', async () => {
    mockGetServerSession.mockResolvedValue(session as never);
    mockDeleteInvoice.mockResolvedValue(undefined);
    const result = await deleteInvoiceAction(invoiceId);
    expect(result.success).toBe(true);
  });

  it('returns error when invoice is not CANCELLED', async () => {
    mockGetServerSession.mockResolvedValue(session as never);
    mockDeleteInvoice.mockRejectedValue(new Error('Only cancelled invoices can be deleted'));
    const result = await deleteInvoiceAction(invoiceId);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe('Only cancelled invoices can be deleted');
    }
  });

  it('returns error when invoice not found', async () => {
    mockGetServerSession.mockResolvedValue(session as never);
    mockDeleteInvoice.mockRejectedValue(new Error('Invoice not found'));
    const result = await deleteInvoiceAction(invoiceId);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.message).toBe('Invoice not found');
  });
});
