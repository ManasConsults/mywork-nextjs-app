import {
  sendRegistrationPendingEmail,
  sendAccountApprovedEmail,
  sendAccountRejectedEmail,
  sendInvoiceEmail,
  sendPaymentReminderEmail,
} from './notifications';

jest.mock('./resend', () => ({
  resend: { emails: { send: jest.fn() } },
}));

import { resend } from './resend';

// resend is mocked as non-null above — assert to bypass the Resend | null type
const mockSend = resend!.emails.send as jest.Mock;

const TO = 'user@example.com';
const NAME = 'Jane Doe';

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
  mockSend.mockResolvedValue({ data: { id: 'email-id' }, error: null, headers: null } as never);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('sendRegistrationPendingEmail', () => {
  it('sends to the correct address with the correct subject', async () => {
    await sendRegistrationPendingEmail(TO, NAME);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: TO,
        subject: 'Your MyWork registration is under review',
      }),
    );
  });

  it('includes the user name in the email body', async () => {
    await sendRegistrationPendingEmail(TO, NAME);
    const call = mockSend.mock.calls[0][0] as { html: string };
    expect(call.html).toContain(NAME);
  });

  it('uses fallback greeting when name is null', async () => {
    await sendRegistrationPendingEmail(TO, null);
    const call = mockSend.mock.calls[0][0] as { html: string };
    expect(call.html).toContain('Hi there');
  });

  it('does not throw when send fails', async () => {
    mockSend.mockRejectedValue(new Error('Network error'));
    await expect(sendRegistrationPendingEmail(TO, NAME)).resolves.toBeUndefined();
  });
});

describe('sendAccountApprovedEmail', () => {
  it('sends to the correct address with the correct subject', async () => {
    await sendAccountApprovedEmail(TO, NAME);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: TO,
        subject: 'Your MyWork account has been approved',
      }),
    );
  });

  it('includes a sign-in link in the email body', async () => {
    await sendAccountApprovedEmail(TO, NAME);
    const call = mockSend.mock.calls[0][0] as { html: string };
    expect(call.html).toContain('/login');
  });

  it('does not throw when send fails', async () => {
    mockSend.mockRejectedValue(new Error('Network error'));
    await expect(sendAccountApprovedEmail(TO, NAME)).resolves.toBeUndefined();
  });
});

describe('sendAccountRejectedEmail', () => {
  it('sends to the correct address with the correct subject', async () => {
    await sendAccountRejectedEmail(TO, NAME);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: TO,
        subject: 'Your MyWork registration was not approved',
      }),
    );
  });

  it('does not throw when send fails', async () => {
    mockSend.mockRejectedValue(new Error('Network error'));
    await expect(sendAccountRejectedEmail(TO, NAME)).resolves.toBeUndefined();
  });
});

const PDF = Buffer.from('pdf');
const invoiceParams = {
  invoiceNumber: 'INV-2026-001',
  senderName: 'Acme Ltd',
  clientName: 'Bob',
  contactName: null,
  total: 1250,
  currency: 'GBP',
  pdfBuffer: PDF,
};

describe('sendInvoiceEmail', () => {
  it('returns { sent: true } on success', async () => {
    const result = await sendInvoiceEmail(TO, invoiceParams);
    expect(result.sent).toBe(true);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ to: TO, subject: expect.stringContaining('INV-2026-001') }),
    );
  });

  it('addresses the email to contactName when set', async () => {
    await sendInvoiceEmail(TO, { ...invoiceParams, contactName: 'Jane Smith' });
    const call = mockSend.mock.calls[0][0] as { html: string };
    expect(call.html).toContain('Jane Smith');
    expect(call.html).not.toContain('Dear Bob');
  });

  it('falls back to clientName when contactName is null', async () => {
    await sendInvoiceEmail(TO, { ...invoiceParams, contactName: null });
    const call = mockSend.mock.calls[0][0] as { html: string };
    expect(call.html).toContain('Dear Bob');
  });

  it('includes cc when provided', async () => {
    await sendInvoiceEmail(TO, { ...invoiceParams, cc: 'sender@example.com' });
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ cc: ['sender@example.com'] }),
    );
  });

  it('omits cc when not provided', async () => {
    await sendInvoiceEmail(TO, invoiceParams);
    const call = mockSend.mock.calls[0][0] as Record<string, unknown>;
    expect(call).not.toHaveProperty('cc');
  });

  it('returns { sent: false } when resend is not configured', async () => {
    // Temporarily override the mock so resend appears null inside the module
    jest.resetModules();
    jest.doMock('./resend', () => ({ resend: null }));
    const { sendInvoiceEmail: fn } = await import('./notifications');
    const result = await fn(TO, invoiceParams);
    expect(result.sent).toBe(false);
    expect(result.error).toBe('Email service is not configured.');
    jest.resetModules();
  });

  it('returns { sent: false, error } when send throws', async () => {
    mockSend.mockRejectedValue(new Error('SMTP error'));
    const result = await sendInvoiceEmail(TO, invoiceParams);
    expect(result.sent).toBe(false);
    expect(result.error).toContain('SMTP error');
  });
});

const reminderParams = {
  invoiceNumber: 'INV-2026-001',
  senderName: 'Acme Ltd',
  clientName: 'Bob',
  contactName: null,
  issueDate: new Date('2026-01-01'),
  dueDate: new Date('2026-02-01'),
  total: 1250,
  currency: 'GBP',
  pdfBuffer: PDF,
};

describe('sendPaymentReminderEmail', () => {
  it('sends with a subject containing the invoice number', async () => {
    await sendPaymentReminderEmail(TO, reminderParams);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ to: TO, subject: expect.stringContaining('INV-2026-001') }),
    );
  });

  it('includes the due date in the email body', async () => {
    await sendPaymentReminderEmail(TO, reminderParams);
    const call = mockSend.mock.calls[0][0] as { html: string };
    expect(call.html).toContain('Feb');
  });

  it('addresses the email to contactName when set', async () => {
    await sendPaymentReminderEmail(TO, { ...reminderParams, contactName: 'Jane Smith' });
    const call = mockSend.mock.calls[0][0] as { html: string };
    expect(call.html).toContain('Jane Smith');
    expect(call.html).not.toContain('Dear Bob');
  });

  it('falls back to clientName when contactName is null', async () => {
    await sendPaymentReminderEmail(TO, { ...reminderParams, contactName: null });
    const call = mockSend.mock.calls[0][0] as { html: string };
    expect(call.html).toContain('Dear Bob');
  });

  it('includes cc when provided', async () => {
    await sendPaymentReminderEmail(TO, { ...reminderParams, cc: 'sender@example.com' });
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ cc: ['sender@example.com'] }),
    );
  });

  it('omits cc when not provided', async () => {
    await sendPaymentReminderEmail(TO, reminderParams);
    const call = mockSend.mock.calls[0][0] as Record<string, unknown>;
    expect(call).not.toHaveProperty('cc');
  });

  it('throws when send fails', async () => {
    mockSend.mockRejectedValue(new Error('SMTP error'));
    await expect(sendPaymentReminderEmail(TO, reminderParams)).rejects.toThrow('SMTP error');
  });
});
