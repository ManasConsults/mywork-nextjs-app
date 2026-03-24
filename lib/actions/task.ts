'use server';

import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import type { Task } from '@prisma/client';

import { authOptions } from '@/lib/auth/auth';
import { createTaskSchema, updateTaskSchema } from '@/lib/schemas/task.schema';
import type { CreateTaskInput, UpdateTaskInput } from '@/lib/schemas/task.schema';
import {
  createTask,
  updateTask,
  softDeleteTask,
} from '@/lib/services/task.service';

type TaskActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string; fields?: Record<string, string[]> } };

async function getAuthUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

export async function createTaskAction(
  input: CreateTaskInput,
): Promise<TaskActionResult<Task>> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { success: false, error: { message: 'You must be signed in.' } };
  }

  const parsed = createTaskSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: { message: 'Validation failed', fields: parsed.error.flatten().fieldErrors as Record<string, string[]> },
    };
  }

  try {
    const task = await createTask(userId, parsed.data);
    revalidatePath('/tasks');
    return { success: true, data: task };
  } catch {
    return { success: false, error: { message: 'Failed to create task.' } };
  }
}

export async function updateTaskAction(
  taskId: string,
  input: UpdateTaskInput,
): Promise<TaskActionResult<Task>> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { success: false, error: { message: 'You must be signed in.' } };
  }

  const parsed = updateTaskSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: { message: 'Validation failed', fields: parsed.error.flatten().fieldErrors as Record<string, string[]> },
    };
  }

  try {
    const task = await updateTask(userId, taskId, parsed.data);
    if (!task) {
      return { success: false, error: { message: 'Task not found.' } };
    }
    revalidatePath('/tasks');
    revalidatePath(`/tasks/${taskId}`);
    return { success: true, data: task };
  } catch {
    return { success: false, error: { message: 'Failed to update task.' } };
  }
}

export async function deleteTaskAction(taskId: string): Promise<TaskActionResult<void>> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { success: false, error: { message: 'You must be signed in.' } };
  }

  try {
    const deleted = await softDeleteTask(userId, taskId);
    if (!deleted) {
      return { success: false, error: { message: 'Task not found.' } };
    }
    revalidatePath('/tasks');
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: { message: 'Failed to delete task.' } };
  }
}
