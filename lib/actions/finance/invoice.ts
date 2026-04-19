'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import type { Invoice } from '@prisma/client';

import { authOptions } from '@/lib/auth/auth';
import {
  createInvoiceSchema,
  updateInvoiceSchema,
  markPaidSchema,
} from '@/lib/schemas/finance/invoice.schema';
import type { CreateInvoiceInput, UpdateInvoiceInput } from '@/lib/schemas/finance/invoice.schema';
import {
  createInvoice,
  updateInvoice,
  sendInvoice,
  markInvoicePaid,
  cancelInvoice,
  revertToDraft,
  sendPaymentReminder,
  deleteInvoice,
  getInvoiceById,
} from '@/lib/services/finance/invoice.service';
import { fetchAndGeneratePdfBuffer } from '@/lib/pdf/generateInvoicePdf';
import { sendInvoiceEmail, sendPaymentReminderEmail } from '@/lib/email/notifications';

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string; fields?: Record<string, string[]> } };

// sendInvoice returns optional emailWarning when the invoice was sent but email failed
type SendInvoiceResult =
  | { success: true; data: Invoice; emailWarning?: string }
  | { success: false; error: { message: string; fields?: Record<string, string[]> } };

async function getAuthSession(): Promise<{ userId: string; currency: string } | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return {
    userId: session.user.id,
    currency: (session.user.currency as string | undefined) ?? 'GBP',
  };
}

// Keep a simple helper for actions that don't need currency
async function getAuthUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

function revalidateInvoicePaths(invoiceId?: string): void {
  revalidatePath('/finance/invoices');
  revalidatePath('/finance');
  if (invoiceId) {
    revalidatePath(`/finance/invoices/${invoiceId}`);
  }
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createInvoiceAction(
  input: CreateInvoiceInput,
): Promise<ActionResult<Invoice>> {
  const auth = await getAuthSession();
  if (!auth) return { success: false, error: { message: 'You must be signed in.' } };

  const parsed = createInvoiceSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        message: 'Validation failed',
        fields: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      },
    };
  }

  try {
    const invoice = await createInvoice(auth.userId, { ...parsed.data, currency: auth.currency });
    revalidateInvoicePaths();
    return { success: true, data: invoice };
  } catch {
    return { success: false, error: { message: 'Failed to create invoice.' } };
  }
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateInvoiceAction(
  id: string,
  input: UpdateInvoiceInput,
): Promise<ActionResult<Invoice>> {
  const userId = await getAuthUserId();
  if (!userId) return { success: false, error: { message: 'You must be signed in.' } };

  const parsed = updateInvoiceSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        message: 'Validation failed',
        fields: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      },
    };
  }

  try {
    const invoice = await updateInvoice(userId, id, parsed.data);
    if (!invoice) return { success: false, error: { message: 'Invoice not found.' } };
    revalidateInvoicePaths(id);
    return { success: true, data: invoice };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Failed to update invoice.';
    return { success: false, error: { message } };
  }
}

// ─── Send ─────────────────────────────────────────────────────────────────────

export async function sendInvoiceAction(id: string): Promise<SendInvoiceResult> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return { success: false, error: { message: 'You must be signed in.' } };

  const senderName = session.user.name ?? null;
  const senderEmail = session.user.email ?? undefined;

  // Guard: client must have an email address before transitioning to SENT (AC-FIN-11-4)
  const invoiceData = await getInvoiceById(userId, id);
  if (!invoiceData) return { success: false, error: { message: 'Invoice not found.' } };
  if (!invoiceData.client.email) {
    return {
      success: false,
      error: { message: 'Client has no email address. Please add one before sending.' },
    };
  }

  try {
    const invoice = await sendInvoice(userId, id);
    revalidateInvoicePaths(id);

    // Generate PDF and send email — non-fatal (AC-FIN-11-5)
    let emailWarning: string | undefined;
    try {
      const pdfBuffer = await fetchAndGeneratePdfBuffer(userId, id);
      const emailResult = await sendInvoiceEmail(invoiceData.client.email, {
        invoiceNumber: invoice.invoiceNumber,
        senderName,
        clientName: invoiceData.client.name,
        contactName: invoiceData.client.contactName ?? null,
        total: invoice.total,
        currency: invoice.currency,
        pdfBuffer,
        cc: senderEmail,
      });
      if (!emailResult.sent) {
        emailWarning = emailResult.error ?? 'Invoice sent but email could not be delivered.';
      }
    } catch {
      emailWarning =
        'Invoice sent but email could not be delivered. You can download the PDF and send manually.';
    }

    return { success: true, data: invoice, ...(emailWarning ? { emailWarning } : {}) };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to send invoice.';
    return { success: false, error: { message } };
  }
}

// ─── Mark Paid ────────────────────────────────────────────────────────────────

export async function markPaidAction(
  id: string,
  paidAt?: Date,
): Promise<ActionResult<Invoice>> {
  const userId = await getAuthUserId();
  if (!userId) return { success: false, error: { message: 'You must be signed in.' } };

  const parsed = markPaidSchema.safeParse({ paidAt });
  if (!parsed.success) {
    return {
      success: false,
      error: {
        message: 'Validation failed',
        fields: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      },
    };
  }

  try {
    const invoice = await markInvoicePaid(userId, id, parsed.data.paidAt);
    revalidateInvoicePaths(id);
    return { success: true, data: invoice };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to mark invoice as paid.';
    return { success: false, error: { message } };
  }
}

// ─── Cancel ───────────────────────────────────────────────────────────────────

export async function cancelInvoiceAction(id: string): Promise<ActionResult<Invoice>> {
  const userId = await getAuthUserId();
  if (!userId) return { success: false, error: { message: 'You must be signed in.' } };

  try {
    const invoice = await cancelInvoice(userId, id);
    revalidateInvoicePaths(id);
    return { success: true, data: invoice };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to cancel invoice.';
    return { success: false, error: { message } };
  }
}

// ─── Revert to Draft ──────────────────────────────────────────────────────────

export async function revertToDraftAction(id: string): Promise<ActionResult<Invoice>> {
  const userId = await getAuthUserId();
  if (!userId) return { success: false, error: { message: 'You must be signed in.' } };

  try {
    const invoice = await revertToDraft(userId, id);
    revalidateInvoicePaths(id);
    return { success: true, data: invoice };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to revert invoice to draft.';
    return { success: false, error: { message } };
  }
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteInvoiceAction(id: string): Promise<ActionResult<void>> {
  const userId = await getAuthUserId();
  if (!userId) return { success: false, error: { message: 'You must be signed in.' } };

  try {
    await deleteInvoice(userId, id);
    revalidateInvoicePaths();
    return { success: true, data: undefined };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete invoice.';
    return { success: false, error: { message } };
  }
}

// ─── Send Payment Reminder ────────────────────────────────────────────────────

export async function sendPaymentReminderAction(
  id: string,
): Promise<ActionResult<{ reminderCount: number; lastReminderAt: Date }>> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return { success: false, error: { message: 'You must be signed in.' } };

  const senderName = session.user.name ?? null;
  const senderEmail = session.user.email ?? undefined;

  // Fetch invoice with client to validate and gather data for email (AC-FIN-18-1, 18-3)
  const invoiceData = await getInvoiceById(userId, id);
  if (!invoiceData) return { success: false, error: { message: 'Invoice not found.' } };

  if (invoiceData.status !== 'SENT') {
    return { success: false, error: { message: 'Reminders can only be sent for SENT invoices.' } };
  }
  if (!invoiceData.dueDate || invoiceData.dueDate >= new Date()) {
    return { success: false, error: { message: 'Reminders can only be sent for overdue invoices.' } };
  }
  if (!invoiceData.client.email) {
    return {
      success: false,
      error: { message: 'Client has no email address. Please add one before sending a reminder.' },
    };
  }

  // Generate PDF and send email FIRST — counter only increments on success (AC-FIN-18-5)
  try {
    const pdfBuffer = await fetchAndGeneratePdfBuffer(userId, id);
    await sendPaymentReminderEmail(invoiceData.client.email, {
      invoiceNumber: invoiceData.invoiceNumber,
      senderName,
      clientName: invoiceData.client.name,
      contactName: invoiceData.client.contactName ?? null,
      issueDate: invoiceData.issueDate,
      dueDate: invoiceData.dueDate,
      total: invoiceData.total,
      currency: invoiceData.currency,
      pdfBuffer,
      cc: senderEmail,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to send reminder email.';
    return { success: false, error: { message } };
  }

  // Email confirmed sent — increment counter
  try {
    const result = await sendPaymentReminder(userId, id);
    revalidateInvoicePaths(id);
    return { success: true, data: result };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to record reminder.';
    return { success: false, error: { message } };
  }
}
