import type { FeedbackSubmission, FeedbackType, FeedbackStatus } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';
import type { CreateFeedbackInput } from '@/lib/schemas/feedback.schema';

export async function createFeedbackSubmission(
  userId: string,
  input: CreateFeedbackInput,
): Promise<FeedbackSubmission> {
  return prisma.feedbackSubmission.create({
    data: {
      userId,
      type: input.type,
      title: input.title,
      description: input.description,
      module: input.module,
    },
  });
}

export async function getFeedbackSubmissionsByUser(
  userId: string,
): Promise<FeedbackSubmission[]> {
  return prisma.feedbackSubmission.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getAllFeedbackSubmissions(filters: {
  type?: FeedbackType;
  status?: FeedbackStatus;
}): Promise<(FeedbackSubmission & { user: { name: string | null; email: string } })[]> {
  return prisma.feedbackSubmission.findMany({
    where: {
      ...(filters.type ? { type: filters.type } : {}),
      ...(filters.status ? { status: filters.status } : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { name: true, email: true } },
    },
  });
}

export async function updateFeedbackSubmissionStatus(
  id: string,
  status: FeedbackStatus,
): Promise<FeedbackSubmission | null> {
  const result = await prisma.feedbackSubmission.updateMany({ where: { id }, data: { status } });
  if (result.count === 0) return null;
  return prisma.feedbackSubmission.findFirst({ where: { id } });
}

export async function deleteFeedbackSubmission(id: string, userId?: string): Promise<boolean> {
  const where = userId ? { id, userId } : { id };
  const result = await prisma.feedbackSubmission.deleteMany({ where });
  return result.count > 0;
}
