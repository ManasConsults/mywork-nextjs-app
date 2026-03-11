'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import type { Account } from '@prisma/client';

import { authOptions } from '@/lib/auth/auth';
import { createAccountSchema, updateAccountSchema } from '@/lib/schemas/finance/account.schema';
import type { CreateAccountInput, UpdateAccountInput } from '@/lib/schemas/finance/account.schema';
import {
  createAccount,
  updateAccount,
  archiveAccount,
} from '@/lib/services/finance/account.service';

type AccountActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string; fields?: Record<string, string[]> } };

async function getAuthUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

export async function createAccountAction(
  input: CreateAccountInput,
): Promise<AccountActionResult<Account>> {
  const userId = await getAuthUserId();
  if (!userId) return { success: false, error: { message: 'You must be signed in.' } };

  const parsed = createAccountSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: { message: 'Validation failed', fields: parsed.error.flatten().fieldErrors as Record<string, string[]> },
    };
  }

  try {
    const account = await createAccount(userId, parsed.data);
    revalidatePath('/finance/accounts');
    revalidatePath('/finance');
    return { success: true, data: account };
  } catch {
    return { success: false, error: { message: 'Failed to create account.' } };
  }
}

export async function updateAccountAction(
  id: string,
  input: UpdateAccountInput,
): Promise<AccountActionResult<Account>> {
  const userId = await getAuthUserId();
  if (!userId) return { success: false, error: { message: 'You must be signed in.' } };

  const parsed = updateAccountSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: { message: 'Validation failed', fields: parsed.error.flatten().fieldErrors as Record<string, string[]> },
    };
  }

  try {
    const account = await updateAccount(userId, id, parsed.data);
    if (!account) return { success: false, error: { message: 'Account not found.' } };
    revalidatePath('/finance/accounts');
    revalidatePath('/finance');
    return { success: true, data: account };
  } catch {
    return { success: false, error: { message: 'Failed to update account.' } };
  }
}

export async function archiveAccountAction(id: string): Promise<AccountActionResult<void>> {
  const userId = await getAuthUserId();
  if (!userId) return { success: false, error: { message: 'You must be signed in.' } };

  try {
    const account = await archiveAccount(userId, id);
    if (!account) return { success: false, error: { message: 'Account not found.' } };
    revalidatePath('/finance/accounts');
    revalidatePath('/finance');
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: { message: 'Failed to archive account.' } };
  }
}
