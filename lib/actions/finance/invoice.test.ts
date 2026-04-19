import {
  createInvoiceAction,
  updateInvoiceAction,
  cancelInvoiceAction,
  deleteInvoiceAction,
  sendInvoiceAction,
  markPaidAction,
  revertToDraftAction,
  sendPaymentReminderAction,
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
  sendInvoice,
  markInvoicePaid,
  revertToDraft,
  sendPaymentReminder,
} from '@/lib/services/finance/invoice.service';
import { sendInvoiceEmail, sendPaymentReminderEmail } from '@/lib/email/notifications';
import { fetchAndGeneratePdfBuffer } from '@/lib/pdf/generateInvoicePdf';

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockCreateInvoice = createInvoice as jest.MockedFunction<typeof createInvoice>;
const mockUpdateInvoice = updateInvoice as jest.MockedFunction<typeof updateInvoice>;
const mockCancelInvoice = cancelInvoice as jest.MockedFunction<typeof cancelInvoice>;
const mockDeleteInvoice = deleteInvoice as jest.MockedFunction<typeof deleteInvoice>;
const mockGetInvoiceById = getInvoiceById as jest.MockedFunction<typeof getInvoiceById>;
const mockSendInvoice = sendInvoice as jest.MockedFunction<typeof sendInvoice>;
const mockMarkInvoicePaid = markInvoicePaid as jest.MockedFunction<typeof markInvoicePaid>;
const mockRevertToDraft = revertToDraft as jest.MockedFunction<typeof revertToDraft>;
const mockSendPaymentReminder = sendPaymentReminder as jest.MockedFunction<typeof sendPaymentReminder>;
const mockSendInvoiceEmail = sendInvoiceEmail as jest.MockedFunction<typeof sendInvoiceEmail>;
const mockSendPaymentReminderEmail = sendPaymentReminderEmail as jest.MockedFunction<typeof sendPaymentReminderEmail>;
const mockFetchAndGeneratePdfBuffer = fetchAndGeneratePdfBuffer as jest.MockedFunction<typeof fetchAndGeneratePdfBuffer>;

const session = { user: { id: 'user-1', name: 'Alice Sender', email: 'alice@example.com', role: 'MEMBER', currency: 'GBP' }, expires: '' };
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

// ─── sendInvoiceAction ────────────────────────────────────────────────────────

const baseInvoiceWithClient = {
  ...baseInvoice,
  client: { id: clientId, name: 'Acme Ltd', contactName: null, email: 'acme@example.com' },
  lineItems: [],
};

describe('sendInvoiceAction', () => {
  it('returns error when not signed in', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const result = await sendInvoiceAction(invoiceId);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.message).toBe('You must be signed in.');
  });

  it('returns error when invoice not found', async () => {
    mockGetServerSession.mockResolvedValue(session as never);
    mockGetInvoiceById.mockResolvedValue(null);
    const result = await sendInvoiceAction(invoiceId);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.message).toBe('Invoice not found.');
  });

  it('returns error when client has no email', async () => {
    mockGetServerSession.mockResolvedValue(session as never);
    mockGetInvoiceById.mockResolvedValue({
      ...baseInvoiceWithClient,
      client: { ...baseInvoiceWithClient.client, email: null },
    } as never);
    const result = await sendInvoiceAction(invoiceId);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain('Client has no email address');
    }
  });

  it('sends invoice and returns success with emailWarning when email fails', async () => {
    mockGetServerSession.mockResolvedValue(session as never);
    mockGetInvoiceById.mockResolvedValue(baseInvoiceWithClient as never);
    mockSendInvoice.mockResolvedValue({ ...baseInvoice, status: 'SENT' });
    mockFetchAndGeneratePdfBuffer.mockResolvedValue(Buffer.from('pdf') as never);
    mockSendInvoiceEmail.mockResolvedValue({ sent: false, error: 'SMTP error' });

    const result = await sendInvoiceAction(invoiceId);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('SENT');
      expect((result as { emailWarning?: string }).emailWarning).toBe('SMTP error');
    }
  });

  it('sends invoice and returns success without emailWarning on delivery success', async () => {
    mockGetServerSession.mockResolvedValue(session as never);
    mockGetInvoiceById.mockResolvedValue(baseInvoiceWithClient as never);
    mockSendInvoice.mockResolvedValue({ ...baseInvoice, status: 'SENT' });
    mockFetchAndGeneratePdfBuffer.mockResolvedValue(Buffer.from('pdf') as never);
    mockSendInvoiceEmail.mockResolvedValue({ sent: true });

    const result = await sendInvoiceAction(invoiceId);
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result as { emailWarning?: string }).emailWarning).toBeUndefined();
    }
    expect(mockSendInvoiceEmail).toHaveBeenCalled();
  });

  it('passes session user name as senderName and email as cc', async () => {
    mockGetServerSession.mockResolvedValue(session as never);
    mockGetInvoiceById.mockResolvedValue(baseInvoiceWithClient as never);
    mockSendInvoice.mockResolvedValue({ ...baseInvoice, status: 'SENT' });
    mockFetchAndGeneratePdfBuffer.mockResolvedValue(Buffer.from('pdf') as never);
    mockSendInvoiceEmail.mockResolvedValue({ sent: true });

    await sendInvoiceAction(invoiceId);

    expect(mockSendInvoiceEmail).toHaveBeenCalledWith(
      'acme@example.com',
      expect.objectContaining({
        senderName: 'Alice Sender',
        cc: 'alice@example.com',
        contactName: null,
      }),
    );
  });

  it('forwards contactName from client to sendInvoiceEmail', async () => {
    mockGetServerSession.mockResolvedValue(session as never);
    mockGetInvoiceById.mockResolvedValue({
      ...baseInvoiceWithClient,
      client: { ...baseInvoiceWithClient.client, contactName: 'Jane Smith' },
    } as never);
    mockSendInvoice.mockResolvedValue({ ...baseInvoice, status: 'SENT' });
    mockFetchAndGeneratePdfBuffer.mockResolvedValue(Buffer.from('pdf') as never);
    mockSendInvoiceEmail.mockResolvedValue({ sent: true });

    await sendInvoiceAction(invoiceId);

    expect(mockSendInvoiceEmail).toHaveBeenCalledWith(
      'acme@example.com',
      expect.objectContaining({ contactName: 'Jane Smith' }),
    );
  });

  it('propagates service error when sendInvoice throws', async () => {
    mockGetServerSession.mockResolvedValue(session as never);
    mockGetInvoiceById.mockResolvedValue(baseInvoiceWithClient as never);
    mockSendInvoice.mockRejectedValue(new Error('Only DRAFT invoices can be sent'));
    const result = await sendInvoiceAction(invoiceId);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.message).toBe('Only DRAFT invoices can be sent');
  });
});

// ─── markPaidAction ───────────────────────────────────────────────────────────

describe('markPaidAction', () => {
  it('returns error when not signed in', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const result = await markPaidAction(invoiceId);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.message).toBe('You must be signed in.');
  });

  it('marks invoice as paid and returns success', async () => {
    mockGetServerSession.mockResolvedValue(session as never);
    mockMarkInvoicePaid.mockResolvedValue({ ...baseInvoice, status: 'PAID', paidAt: now });
    const result = await markPaidAction(invoiceId, now);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.status).toBe('PAID');
    expect(mockMarkInvoicePaid).toHaveBeenCalledWith('user-1', invoiceId, now);
  });

  it('propagates service error', async () => {
    mockGetServerSession.mockResolvedValue(session as never);
    mockMarkInvoicePaid.mockRejectedValue(new Error('Only SENT invoices can be marked as paid'));
    const result = await markPaidAction(invoiceId);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.message).toBe('Only SENT invoices can be marked as paid');
  });
});

// ─── revertToDraftAction ──────────────────────────────────────────────────────

describe('revertToDraftAction', () => {
  it('returns error when not signed in', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const result = await revertToDraftAction(invoiceId);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.message).toBe('You must be signed in.');
  });

  it('reverts invoice to DRAFT and returns success', async () => {
    mockGetServerSession.mockResolvedValue(session as never);
    mockRevertToDraft.mockResolvedValue({ ...baseInvoice, status: 'DRAFT' });
    const result = await revertToDraftAction(invoiceId);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.status).toBe('DRAFT');
  });

  it('propagates service error', async () => {
    mockGetServerSession.mockResolvedValue(session as never);
    mockRevertToDraft.mockRejectedValue(new Error('Cannot revert a PAID invoice to draft'));
    const result = await revertToDraftAction(invoiceId);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.message).toBe('Cannot revert a PAID invoice to draft');
  });
});

// ─── sendPaymentReminderAction ────────────────────────────────────────────────

const overdueInvoice = {
  ...baseInvoiceWithClient,
  status: 'SENT' as const,
  dueDate: new Date('2026-01-01T00:00:00Z'), // in the past relative to now (2026-03-07)
};

describe('sendPaymentReminderAction', () => {
  it('returns error when not signed in', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const result = await sendPaymentReminderAction(invoiceId);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.message).toBe('You must be signed in.');
  });

  it('returns error when invoice not found', async () => {
    mockGetServerSession.mockResolvedValue(session as never);
    mockGetInvoiceById.mockResolvedValue(null);
    const result = await sendPaymentReminderAction(invoiceId);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.message).toBe('Invoice not found.');
  });

  it('returns error when invoice is not SENT', async () => {
    mockGetServerSession.mockResolvedValue(session as never);
    mockGetInvoiceById.mockResolvedValue(baseInvoiceWithClient as never); // status DRAFT
    const result = await sendPaymentReminderAction(invoiceId);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe('Reminders can only be sent for SENT invoices.');
    }
  });

  it('returns error when invoice is not overdue', async () => {
    mockGetServerSession.mockResolvedValue(session as never);
    const futureInvoice = {
      ...overdueInvoice,
      dueDate: new Date('2030-01-01T00:00:00Z'), // future
    };
    mockGetInvoiceById.mockResolvedValue(futureInvoice as never);
    const result = await sendPaymentReminderAction(invoiceId);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe('Reminders can only be sent for overdue invoices.');
    }
  });

  it('returns error when client has no email', async () => {
    mockGetServerSession.mockResolvedValue(session as never);
    mockGetInvoiceById.mockResolvedValue({
      ...overdueInvoice,
      client: { ...overdueInvoice.client, email: null },
    } as never);
    const result = await sendPaymentReminderAction(invoiceId);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain('Client has no email address');
    }
  });

  it('returns error when email delivery throws', async () => {
    mockGetServerSession.mockResolvedValue(session as never);
    mockGetInvoiceById.mockResolvedValue(overdueInvoice as never);
    mockFetchAndGeneratePdfBuffer.mockResolvedValue(Buffer.from('pdf') as never);
    mockSendPaymentReminderEmail.mockRejectedValue(new Error('SMTP timeout'));
    const result = await sendPaymentReminderAction(invoiceId);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.message).toBe('SMTP timeout');
  });

  it('sends reminder and returns updated reminder count', async () => {
    mockGetServerSession.mockResolvedValue(session as never);
    mockGetInvoiceById.mockResolvedValue(overdueInvoice as never);
    mockFetchAndGeneratePdfBuffer.mockResolvedValue(Buffer.from('pdf') as never);
    mockSendPaymentReminderEmail.mockResolvedValue(undefined);
    mockSendPaymentReminder.mockResolvedValue({ reminderCount: 1, lastReminderAt: now });

    const result = await sendPaymentReminderAction(invoiceId);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.reminderCount).toBe(1);
    }
    expect(mockSendPaymentReminderEmail).toHaveBeenCalled();
    expect(mockSendPaymentReminder).toHaveBeenCalledWith('user-1', invoiceId);
  });

  it('passes session user name as senderName and email as cc', async () => {
    mockGetServerSession.mockResolvedValue(session as never);
    mockGetInvoiceById.mockResolvedValue(overdueInvoice as never);
    mockFetchAndGeneratePdfBuffer.mockResolvedValue(Buffer.from('pdf') as never);
    mockSendPaymentReminderEmail.mockResolvedValue(undefined);
    mockSendPaymentReminder.mockResolvedValue({ reminderCount: 1, lastReminderAt: now });

    await sendPaymentReminderAction(invoiceId);

    expect(mockSendPaymentReminderEmail).toHaveBeenCalledWith(
      'acme@example.com',
      expect.objectContaining({
        senderName: 'Alice Sender',
        cc: 'alice@example.com',
        contactName: null,
      }),
    );
  });

  it('forwards contactName from client to sendPaymentReminderEmail', async () => {
    mockGetServerSession.mockResolvedValue(session as never);
    mockGetInvoiceById.mockResolvedValue({
      ...overdueInvoice,
      client: { ...overdueInvoice.client, contactName: 'Jane Smith' },
    } as never);
    mockFetchAndGeneratePdfBuffer.mockResolvedValue(Buffer.from('pdf') as never);
    mockSendPaymentReminderEmail.mockResolvedValue(undefined);
    mockSendPaymentReminder.mockResolvedValue({ reminderCount: 1, lastReminderAt: now });

    await sendPaymentReminderAction(invoiceId);

    expect(mockSendPaymentReminderEmail).toHaveBeenCalledWith(
      'acme@example.com',
      expect.objectContaining({ contactName: 'Jane Smith' }),
    );
  });
});
