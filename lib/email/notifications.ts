import { resend } from './resend';

const FROM = process.env.RESEND_FROM ?? 'MyWork <noreply@mywork.app>';
const APP_URL = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';

function greeting(name: string | null): string {
  return name ? `Hi ${name}` : 'Hi there';
}

export async function sendRegistrationPendingEmail(
  to: string,
  name: string | null,
): Promise<void> {
  if (!resend) return;
  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: 'Your MyWork registration is under review',
      html: `
        <p>${greeting(name)},</p>
        <p>Thank you for registering with MyWork. Your account is currently pending admin approval.</p>
        <p>We'll send you another email once your account has been reviewed.</p>
        <p>— The MyWork Team</p>
      `,
    });
  } catch {
    console.error('[email] Failed to send registration pending email to', to);
  }
}

export async function sendAccountApprovedEmail(
  to: string,
  name: string | null,
): Promise<void> {
  if (!resend) return;
  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: 'Your MyWork account has been approved',
      html: `
        <p>${greeting(name)},</p>
        <p>Great news — your MyWork account has been approved by an admin.</p>
        <p>You can now <a href="${APP_URL}/login">sign in here</a>.</p>
        <p>— The MyWork Team</p>
      `,
    });
  } catch {
    console.error('[email] Failed to send account approved email to', to);
  }
}

export async function sendAccountRejectedEmail(
  to: string,
  name: string | null,
): Promise<void> {
  if (!resend) return;
  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: 'Your MyWork registration was not approved',
      html: `
        <p>${greeting(name)},</p>
        <p>After review, your MyWork registration was not approved at this time.</p>
        <p>If you believe this is a mistake, please contact an administrator.</p>
        <p>— The MyWork Team</p>
      `,
    });
  } catch {
    console.error('[email] Failed to send account rejected email to', to);
  }
}

// ─── Invoice emails ────────────────────────────────────────────────────────────

function fmtCurrency(minor: number, currency: string): string {
  return (minor / 100).toLocaleString('en-GB', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

/**
 * Send the invoice PDF to the client.
 * Returns { sent: true } on success, { sent: false, error } on any failure (non-throwing).
 */
export async function sendInvoiceEmail(
  to: string,
  params: {
    invoiceNumber: string;
    senderName: string | null;
    clientName: string;
    total: number;
    currency: string;
    pdfBuffer: Buffer;
  },
): Promise<{ sent: boolean; error?: string }> {
  if (!resend) return { sent: false, error: 'Email service is not configured.' };

  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: `Invoice ${params.invoiceNumber} from ${params.senderName ?? 'MyWork'}`,
      html: `
        <p>Dear ${params.clientName},</p>
        <p>Please find your invoice <strong>${params.invoiceNumber}</strong> for
        <strong>${fmtCurrency(params.total, params.currency)}</strong> attached.</p>
        <p>Please do not hesitate to get in touch if you have any questions.</p>
        <p>Kind regards,<br>${params.senderName ?? 'MyWork'}</p>
      `,
      attachments: [{ filename: `${params.invoiceNumber}.pdf`, content: params.pdfBuffer }],
    });
    return { sent: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { sent: false, error: `Email delivery failed: ${message}` };
  }
}

/**
 * Send a payment reminder email with the invoice PDF attached.
 * Throws on failure so the caller can gate the reminder counter increment.
 */
export async function sendPaymentReminderEmail(
  to: string,
  params: {
    invoiceNumber: string;
    senderName: string | null;
    clientName: string;
    issueDate: Date;
    dueDate: Date;
    total: number;
    currency: string;
    pdfBuffer: Buffer;
  },
): Promise<void> {
  if (!resend) throw new Error('Email service is not configured.');

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Payment reminder: Invoice ${params.invoiceNumber}`,
    html: `
      <p>Dear ${params.clientName},</p>
      <p>This is a friendly reminder that invoice <strong>${params.invoiceNumber}</strong>,
      issued on ${fmtDate(params.issueDate)}, was due on
      <strong>${fmtDate(params.dueDate)}</strong>.</p>
      <p>The outstanding amount is <strong>${fmtCurrency(params.total, params.currency)}</strong>.</p>
      <p>Please find the original invoice attached. If you have already made payment,
      please disregard this reminder.</p>
      <p>Kind regards,<br>${params.senderName ?? 'MyWork'}</p>
    `,
    attachments: [{ filename: `${params.invoiceNumber}.pdf`, content: params.pdfBuffer }],
  });
}
