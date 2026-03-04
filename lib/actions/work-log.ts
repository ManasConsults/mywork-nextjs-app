'use server';

import { getServerSession } from 'next-auth';
import type { WorkLog } from '@prisma/client';

import { authOptions } from '@/lib/auth/auth';
import { createWorkLogSchema, updateWorkLogSchema } from '@/lib/schemas/work-log.schema';
import type { CreateWorkLogInput, UpdateWorkLogInput } from '@/lib/schemas/work-log.schema';
import { createWorkLog, updateWorkLog, deleteWorkLog } from '@/lib/services/work-log.service';

type WorkLogActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string; fields?: Record<string, string[]> } };

async function getAuthUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

export async function createWorkLogAction(
  input: CreateWorkLogInput,
): Promise<WorkLogActionResult<WorkLog>> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { success: false, error: { message: 'You must be signed in.' } };
  }

  const parsed = createWorkLogSchema.safeParse(input);
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
    const workLog = await createWorkLog(userId, parsed.data);
    if (!workLog) {
      return { success: false, error: { message: 'Task not found or not accessible.' } };
    }
    return { success: true, data: workLog };
  } catch {
    return { success: false, error: { message: 'Failed to create work log.' } };
  }
}

export async function updateWorkLogAction(
  workLogId: string,
  input: UpdateWorkLogInput,
): Promise<WorkLogActionResult<WorkLog>> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { success: false, error: { message: 'You must be signed in.' } };
  }

  const parsed = updateWorkLogSchema.safeParse(input);
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
    const workLog = await updateWorkLog(userId, workLogId, parsed.data);
    if (!workLog) {
      return { success: false, error: { message: 'Work log not found.' } };
    }
    return { success: true, data: workLog };
  } catch {
    return { success: false, error: { message: 'Failed to update work log.' } };
  }
}

export async function deleteWorkLogAction(
  workLogId: string,
): Promise<WorkLogActionResult<void>> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { success: false, error: { message: 'You must be signed in.' } };
  }

  try {
    const deleted = await deleteWorkLog(userId, workLogId);
    if (!deleted) {
      return { success: false, error: { message: 'Work log not found.' } };
    }
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: { message: 'Failed to delete work log.' } };
  }
}
