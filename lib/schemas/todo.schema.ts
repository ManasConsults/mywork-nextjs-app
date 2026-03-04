import { z } from 'zod';

export const createTodoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500, 'Title must be 500 characters or fewer'),
  dueDate: z.coerce.date().optional().nullable(),
  taskId: z.string().uuid().optional().nullable(),
});

export const updateTodoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500, 'Title must be 500 characters or fewer').optional(),
  dueDate: z.coerce.date().optional().nullable(),
  isDone: z.boolean().optional(),
  taskId: z.string().uuid().optional().nullable(),
});

export type CreateTodoInput = z.infer<typeof createTodoSchema>;
export type UpdateTodoInput = z.infer<typeof updateTodoSchema>;
