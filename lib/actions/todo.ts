'use server';

import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { authOptions } from '@/lib/auth/auth';
import { createTodoSchema, updateTodoSchema } from '@/lib/schemas/todo.schema';
import type { CreateTodoInput, UpdateTodoInput } from '@/lib/schemas/todo.schema';
import { createTodo, updateTodo, deleteTodo } from '@/lib/services/todo.service';
import type { TodoItemWithTask } from '@/lib/services/todo.service';

type TodoActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string; fields?: Record<string, string[]> } };

async function getAuthUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

export async function createTodoAction(
  input: CreateTodoInput,
): Promise<TodoActionResult<TodoItemWithTask>> {
  const userId = await getAuthUserId();
  if (!userId) return { success: false, error: { message: 'You must be signed in.' } };

  const parsed = createTodoSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        message: 'Validation failed.',
        fields: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      },
    };
  }

  try {
    const todo = await createTodo(userId, parsed.data);
    revalidatePath('/todo');
    return { success: true, data: todo };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create to-do.';
    return { success: false, error: { message } };
  }
}

export async function updateTodoAction(
  id: string,
  input: UpdateTodoInput,
): Promise<TodoActionResult<TodoItemWithTask>> {
  const userId = await getAuthUserId();
  if (!userId) return { success: false, error: { message: 'You must be signed in.' } };

  const parsed = updateTodoSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        message: 'Validation failed.',
        fields: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      },
    };
  }

  try {
    const todo = await updateTodo(userId, id, parsed.data);
    if (!todo) return { success: false, error: { message: 'To-do not found.' } };
    revalidatePath('/todo');
    return { success: true, data: todo };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update to-do.';
    return { success: false, error: { message } };
  }
}

export async function deleteTodoAction(id: string): Promise<TodoActionResult<void>> {
  const userId = await getAuthUserId();
  if (!userId) return { success: false, error: { message: 'You must be signed in.' } };

  try {
    const deleted = await deleteTodo(userId, id);
    if (!deleted) return { success: false, error: { message: 'To-do not found.' } };
    revalidatePath('/todo');
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: { message: 'Failed to delete to-do.' } };
  }
}
