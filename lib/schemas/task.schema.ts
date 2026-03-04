import { z } from 'zod';

export const TASK_STATUSES = ['BACKLOG', 'IN_PROGRESS', 'BLOCKED', 'DONE'] as const;
export const TASK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or fewer'),
  description: z.string().max(5000, 'Description must be 5000 characters or fewer').optional(),
  status: z.enum(TASK_STATUSES).default('BACKLOG'),
  priority: z.enum(TASK_PRIORITIES).default('MEDIUM'),
  dueDate: z.coerce.date().optional().nullable(),
  tags: z.array(z.string().max(50)).max(20).default([]),
});

export const updateTaskSchema = createTaskSchema.partial();

export const taskFiltersSchema = z.object({
  status: z.enum(TASK_STATUSES).optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskFilters = z.infer<typeof taskFiltersSchema>;
