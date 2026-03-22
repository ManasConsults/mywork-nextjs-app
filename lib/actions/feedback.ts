'use server';

import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import type { FeedbackSubmission } from '@prisma/client';

import { authOptions } from '@/lib/auth/auth';
import { createFeedbackSchema, updateFeedbackStatusSchema } from '@/lib/schemas/feedback.schema';
import type { CreateFeedbackInput } from '@/lib/schemas/feedback.schema';
import logger from '@/lib/utils/logger';
import {
  createFeedbackSubmission,
  updateFeedbackSubmissionStatus,
  deleteFeedbackSubmission,
} from '@/lib/services/feedback.service';

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string; fields?: Record<string, string[]> } };

async function getAuthSession() {
  const session = await getServerSession(authOptions);
  return session;
}

export async function submitFeedbackAction(
  input: CreateFeedbackInput,
): Promise<ActionResult<FeedbackSubmission>> {
  const session = await getAuthSession();
  const userId = session?.user?.id;
  if (!userId) {
    return { success: false, error: { message: 'You must be signed in.' } };
  }

  const parsed = createFeedbackSchema.safeParse(input);
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
    const submission = await createFeedbackSubmission(userId, parsed.data);
    revalidatePath('/feedback');
    return { success: true, data: submission };
  } catch {
    return { success: false, error: { message: 'Failed to submit feedback. Please try again.' } };
  }
}

export async function updateFeedbackStatusAction(
  id: string,
  status: string,
): Promise<ActionResult<FeedbackSubmission>> {
  const session = await getAuthSession();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user?.id || user.role !== 'ADMIN') {
    return { success: false, error: { message: 'Forbidden.' } };
  }

  const parsed = updateFeedbackStatusSchema.safeParse({ status });
  if (!parsed.success) {
    return {
      success: false,
      error: {
        message: 'Invalid status value',
        fields: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      },
    };
  }

  try {
    const updated = await updateFeedbackSubmissionStatus(id, parsed.data.status);
    if (!updated) {
      return { success: false, error: { message: 'Submission not found.' } };
    }
    revalidatePath('/admin/feedback');
    return { success: true, data: updated };
  } catch {
    return { success: false, error: { message: 'Failed to update status.' } };
  }
}

export async function deleteFeedbackSubmissionAction(
  id: string,
): Promise<ActionResult<void>> {
  const session = await getAuthSession();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user?.id || user.role !== 'ADMIN') {
    return { success: false, error: { message: 'Forbidden.' } };
  }

  // Structured warn log for GDPR audit trail — never log PII fields (title, description)
  logger.warn({ submissionId: id, adminUserId: user.id, action: 'feedback.hardDelete' }, 'Admin hard-deleted feedback submission');

  try {
    const deleted = await deleteFeedbackSubmission(id);
    if (!deleted) {
      return { success: false, error: { message: 'Submission not found.' } };
    }
    revalidatePath('/admin/feedback');
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: { message: 'Failed to delete submission.' } };
  }
}
