'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import type { Budget } from '@prisma/client';

import { authOptions } from '@/lib/auth/auth';
import {
  createBudgetSchema,
  updateBudgetSchema,
} from '@/lib/schemas/finance/budget.schema';
import type {
  CreateBudgetInput,
  UpdateBudgetInput,
} from '@/lib/schemas/finance/budget.schema';
import {
  createBudget,
  updateBudget,
  deleteBudget,
} from '@/lib/services/finance/budget.service';

type BudgetActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string; fields?: Record<string, string[]> } };

async function getAuthUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

export async function createBudgetAction(
  input: CreateBudgetInput,
): Promise<BudgetActionResult<Budget>> {
  const userId = await getAuthUserId();
  if (!userId) return { success: false, error: { message: 'You must be signed in.' } };

  const parsed = createBudgetSchema.safeParse(input);
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
    const budget = await createBudget(userId, parsed.data);
    revalidatePath('/finance/budgets');
    revalidatePath('/finance');
    return { success: true, data: budget };
  } catch (err: unknown) {
    // Unique constraint violation (one active budget per category + period)
    if (
      err instanceof Error &&
      err.message.includes('Unique constraint failed')
    ) {
      return {
        success: false,
        error: {
          message:
            'A budget for this category and period already exists. Please update the existing one instead.',
        },
      };
    }
    return { success: false, error: { message: 'Failed to create budget.' } };
  }
}

export async function updateBudgetAction(
  id: string,
  input: UpdateBudgetInput,
): Promise<BudgetActionResult<Budget>> {
  const userId = await getAuthUserId();
  if (!userId) return { success: false, error: { message: 'You must be signed in.' } };

  const parsed = updateBudgetSchema.safeParse(input);
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
    const budget = await updateBudget(userId, id, parsed.data);
    if (!budget) return { success: false, error: { message: 'Budget not found.' } };
    revalidatePath('/finance/budgets');
    revalidatePath('/finance');
    return { success: true, data: budget };
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      err.message.includes('Unique constraint failed')
    ) {
      return {
        success: false,
        error: {
          message:
            'A budget for this category and period already exists.',
        },
      };
    }
    return { success: false, error: { message: 'Failed to update budget.' } };
  }
}

export async function deleteBudgetAction(
  id: string,
): Promise<BudgetActionResult<void>> {
  const userId = await getAuthUserId();
  if (!userId) return { success: false, error: { message: 'You must be signed in.' } };

  try {
    const deleted = await deleteBudget(userId, id);
    if (!deleted) return { success: false, error: { message: 'Budget not found.' } };
    revalidatePath('/finance/budgets');
    revalidatePath('/finance');
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: { message: 'Failed to delete budget.' } };
  }
}
