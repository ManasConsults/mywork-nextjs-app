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

export interface FeedbackListOptions {
  type?: FeedbackType;
  status?: FeedbackStatus;
  page?: number;
  pageSize?: number;
}

export interface FeedbackListResult {
  items: FeedbackSubmission[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function getFeedbackSubmissionsByUser(
  userId: string,
  opts: FeedbackListOptions = {},
): Promise<FeedbackListResult> {
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = opts.pageSize ?? 10;
  const where = {
    userId,
    ...(opts.type ? { type: opts.type } : {}),
    ...(opts.status ? { status: opts.status } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.feedbackSubmission.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.feedbackSubmission.count({ where }),
  ]);

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export interface AdminFeedbackListResult {
  items: (FeedbackSubmission & { user: { name: string | null; email: string } })[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function getAllFeedbackSubmissions(
  filters: { type?: FeedbackType; status?: FeedbackStatus },
  pagination: { page?: number; pageSize?: number } = {},
): Promise<AdminFeedbackListResult> {
  const page = Math.max(1, pagination.page ?? 1);
  const pageSize = pagination.pageSize ?? 10;
  const where = {
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.status ? { status: filters.status } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.feedbackSubmission.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.feedbackSubmission.count({ where }),
  ]);

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
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
