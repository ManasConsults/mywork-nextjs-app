import { z } from 'zod';

export const createLineItemSchema = z.object({
  description: z.string().min(1, 'Description is required').max(500, 'Description must be 500 characters or fewer'),
  quantity: z.number().positive('Quantity must be positive'),
  unitPrice: z.number().int().positive('Unit price must be a positive integer (minor units)'),
  sortOrder: z.number().int().default(0),
});

export const updateLineItemSchema = createLineItemSchema.partial();

export const addFromWorkLogsSchema = z.object({
  workLogIds: z.array(z.string().uuid('Each work log ID must be a valid UUID')),
  unitPrice: z.number().int().positive('Unit price must be a positive integer (minor units)'),
});

export type CreateLineItemInput = z.infer<typeof createLineItemSchema>;
export type UpdateLineItemInput = z.infer<typeof updateLineItemSchema>;
export type AddFromWorkLogsInput = z.infer<typeof addFromWorkLogsSchema>;
