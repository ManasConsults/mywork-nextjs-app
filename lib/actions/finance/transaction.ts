'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import type { Transaction } from '@prisma/client';

import { authOptions } from '@/lib/auth/auth';
import {
  createTransactionSchema,
  updateTransactionSchema,
} from '@/lib/schemas/finance/transaction.schema';
import type {
  CreateTransactionInput,
  UpdateTransactionInput,
} from '@/lib/schemas/finance/transaction.schema';
import {
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from '@/lib/services/finance/transaction.service';

type TransactionActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string; fields?: Record<string, string[]> } };

async function getAuthUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

export async function createTransactionAction(
  input: CreateTransactionInput,
): Promise<TransactionActionResult<Transaction>> {
  const userId = await getAuthUserId();
  if (!userId) return { success: false, error: { message: 'You must be signed in.' } };

  const parsed = createTransactionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: { message: 'Validation failed', fields: parsed.error.flatten().fieldErrors as Record<string, string[]> },
    };
  }

  try {
    const transaction = await createTransaction(userId, parsed.data);
    revalidatePath('/finance/transactions');
    revalidatePath('/finance');
    return { success: true, data: transaction };
  } catch {
    return { success: false, error: { message: 'Failed to create transaction.' } };
  }
}

export async function updateTransactionAction(
  id: string,
  input: UpdateTransactionInput,
): Promise<TransactionActionResult<Transaction>> {
  const userId = await getAuthUserId();
  if (!userId) return { success: false, error: { message: 'You must be signed in.' } };

  const parsed = updateTransactionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: { message: 'Validation failed', fields: parsed.error.flatten().fieldErrors as Record<string, string[]> },
    };
  }

  try {
    const transaction = await updateTransaction(userId, id, parsed.data);
    if (!transaction) return { success: false, error: { message: 'Transaction not found.' } };
    revalidatePath('/finance/transactions');
    revalidatePath('/finance');
    return { success: true, data: transaction };
  } catch {
    return { success: false, error: { message: 'Failed to update transaction.' } };
  }
}

export async function deleteTransactionAction(id: string): Promise<TransactionActionResult<void>> {
  const userId = await getAuthUserId();
  if (!userId) return { success: false, error: { message: 'You must be signed in.' } };

  try {
    const deleted = await deleteTransaction(userId, id);
    if (!deleted) return { success: false, error: { message: 'Transaction not found.' } };
    revalidatePath('/finance/transactions');
    revalidatePath('/finance');
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: { message: 'Failed to delete transaction.' } };
  }
}
