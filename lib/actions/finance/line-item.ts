'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth/auth';
import {
  createLineItemSchema,
  updateLineItemSchema,
  addFromWorkLogsSchema,
} from '@/lib/schemas/finance/line-item.schema';
import type { CreateLineItemInput, UpdateLineItemInput } from '@/lib/schemas/finance/line-item.schema';
import {
  addLineItem,
  addLineItemsFromWorkLogs,
  updateLineItem,
  deleteLineItem,
} from '@/lib/services/finance/line-item.service';

type ActionResult =
  | { success: true }
  | { success: false; error: { message: string; fields?: Record<string, string[]> } };

async function getAuthUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

function revalidateInvoicePath(invoiceId: string): void {
  revalidatePath(`/finance/invoices/${invoiceId}`);
}

// ─── Add Line Item ────────────────────────────────────────────────────────────

export async function addLineItemAction(
  invoiceId: string,
  input: CreateLineItemInput,
): Promise<ActionResult> {
  const userId = await getAuthUserId();
  if (!userId) return { success: false, error: { message: 'You must be signed in.' } };

  const parsed = createLineItemSchema.safeParse(input);
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
    await addLineItem(userId, invoiceId, parsed.data);
    revalidateInvoicePath(invoiceId);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to add line item.';
    return { success: false, error: { message } };
  }
}

// ─── Add From Work Logs ───────────────────────────────────────────────────────

export async function addFromWorkLogsAction(
  invoiceId: string,
  workLogIds: string[],
  unitPrice: number,
): Promise<ActionResult> {
  const userId = await getAuthUserId();
  if (!userId) return { success: false, error: { message: 'You must be signed in.' } };

  const parsed = addFromWorkLogsSchema.safeParse({ workLogIds, unitPrice });
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
    await addLineItemsFromWorkLogs(
      userId,
      invoiceId,
      parsed.data.workLogIds,
      parsed.data.unitPrice,
    );
    revalidateInvoicePath(invoiceId);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to add line items from work logs.';
    return { success: false, error: { message } };
  }
}

// ─── Update Line Item ─────────────────────────────────────────────────────────

export async function updateLineItemAction(
  invoiceId: string,
  lineItemId: string,
  input: UpdateLineItemInput,
): Promise<ActionResult> {
  const userId = await getAuthUserId();
  if (!userId) return { success: false, error: { message: 'You must be signed in.' } };

  const parsed = updateLineItemSchema.safeParse(input);
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
    const lineItem = await updateLineItem(userId, invoiceId, lineItemId, parsed.data);
    if (!lineItem) return { success: false, error: { message: 'Line item not found.' } };
    revalidateInvoicePath(invoiceId);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update line item.';
    return { success: false, error: { message } };
  }
}

// ─── Delete Line Item ─────────────────────────────────────────────────────────

export async function deleteLineItemAction(
  invoiceId: string,
  lineItemId: string,
): Promise<ActionResult> {
  const userId = await getAuthUserId();
  if (!userId) return { success: false, error: { message: 'You must be signed in.' } };

  try {
    const deleted = await deleteLineItem(userId, invoiceId, lineItemId);
    if (!deleted) return { success: false, error: { message: 'Line item not found.' } };
    revalidateInvoicePath(invoiceId);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete line item.';
    return { success: false, error: { message } };
  }
}
