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

export const TODO_SORT_BY = ['createdAt', 'dueDate', 'status'] as const;
export const TODO_STATUS_FILTER = ['incomplete', 'complete', 'all'] as const;
export const TODO_PAGE_SIZES = [10, 20, 50, 100] as const;
export const TODO_DEFAULT_PAGE_SIZE = 20;

export const todoFiltersSchema = z.object({
  status: z.enum(TODO_STATUS_FILTER).default('incomplete'),
  sortBy: z.enum(TODO_SORT_BY).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .refine((v) => (TODO_PAGE_SIZES as readonly number[]).includes(v), {
      message: 'Invalid page size',
    })
    .default(TODO_DEFAULT_PAGE_SIZE),
});

export type CreateTodoInput = z.infer<typeof createTodoSchema>;
export type UpdateTodoInput = z.infer<typeof updateTodoSchema>;
export type TodoFilters = z.infer<typeof todoFiltersSchema>;
