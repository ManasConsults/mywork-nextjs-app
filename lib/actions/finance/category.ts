'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import type { Category } from '@prisma/client';

import { authOptions } from '@/lib/auth/auth';
import { createCategorySchema, updateCategorySchema } from '@/lib/schemas/finance/category.schema';
import type { CreateCategoryInput, UpdateCategoryInput } from '@/lib/schemas/finance/category.schema';
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from '@/lib/services/finance/category.service';

type CategoryActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string; fields?: Record<string, string[]> } };

async function getAuthUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

export async function createCategoryAction(
  input: CreateCategoryInput,
): Promise<CategoryActionResult<Category>> {
  const userId = await getAuthUserId();
  if (!userId) return { success: false, error: { message: 'You must be signed in.' } };

  const parsed = createCategorySchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: { message: 'Validation failed', fields: parsed.error.flatten().fieldErrors as Record<string, string[]> },
    };
  }

  try {
    const category = await createCategory(userId, parsed.data);
    revalidatePath('/finance/categories');
    return { success: true, data: category };
  } catch {
    return { success: false, error: { message: 'Failed to create category.' } };
  }
}

export async function updateCategoryAction(
  id: string,
  input: UpdateCategoryInput,
): Promise<CategoryActionResult<Category>> {
  const userId = await getAuthUserId();
  if (!userId) return { success: false, error: { message: 'You must be signed in.' } };

  const parsed = updateCategorySchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: { message: 'Validation failed', fields: parsed.error.flatten().fieldErrors as Record<string, string[]> },
    };
  }

  try {
    const category = await updateCategory(userId, id, parsed.data);
    if (!category) return { success: false, error: { message: 'Category not found.' } };
    revalidatePath('/finance/categories');
    return { success: true, data: category };
  } catch {
    return { success: false, error: { message: 'Failed to update category.' } };
  }
}

export async function deleteCategoryAction(id: string): Promise<CategoryActionResult<void>> {
  const userId = await getAuthUserId();
  if (!userId) return { success: false, error: { message: 'You must be signed in.' } };

  try {
    const deleted = await deleteCategory(userId, id);
    if (!deleted) return { success: false, error: { message: 'Category not found.' } };
    revalidatePath('/finance/categories');
    return { success: true, data: undefined };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete category.';
    return { success: false, error: { message } };
  }
}
