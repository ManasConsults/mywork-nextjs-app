import { z } from 'zod';

export const createWorkLogSchema = z.object({
  taskId: z.string().uuid('Invalid task ID'),
  date: z.coerce.date(),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must be 2000 characters or fewer'),
  timeSpent: z
    .number()
    .positive('Time spent must be greater than 0')
    .max(24, 'Time spent cannot exceed 24 hours')
    .optional(),
  outcome: z.string().max(500, 'Outcome must be 500 characters or fewer').optional(),
});

export const updateWorkLogSchema = createWorkLogSchema
  .omit({ taskId: true })
  .partial();

export const workLogFiltersSchema = z.object({
  taskId: z.string().uuid().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export type CreateWorkLogInput = z.infer<typeof createWorkLogSchema>;
export type UpdateWorkLogInput = z.infer<typeof updateWorkLogSchema>;
export type WorkLogFilters = z.infer<typeof workLogFiltersSchema>;
