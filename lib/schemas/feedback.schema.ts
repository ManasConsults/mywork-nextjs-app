import { z } from 'zod';

export const FEEDBACK_TYPES = ['FEATURE_REQUEST', 'BUG'] as const;
export const FEEDBACK_STATUSES = ['OPEN', 'IN_REVIEW', 'RESOLVED'] as const;

export const createFeedbackSchema = z.object({
  type: z.enum(FEEDBACK_TYPES, { error: 'Please select a type' }),
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or fewer'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(2000, 'Description must be 2000 characters or fewer'),
  module: z.string().min(1).max(50),
});

export const updateFeedbackStatusSchema = z.object({
  status: z.enum(FEEDBACK_STATUSES),
});

export const feedbackFiltersSchema = z.object({
  type: z.enum(FEEDBACK_TYPES).optional(),
  status: z.enum(FEEDBACK_STATUSES).optional(),
});

export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;
export type FeedbackSubmissionInput = CreateFeedbackInput;
export type UpdateFeedbackStatusInput = z.infer<typeof updateFeedbackStatusSchema>;
export type FeedbackFilters = z.infer<typeof feedbackFiltersSchema>;
