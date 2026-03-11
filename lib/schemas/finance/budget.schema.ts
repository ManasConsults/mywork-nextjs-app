import { z } from 'zod';

export const createBudgetSchema = z.object({
  categoryId: z.string().uuid('Category must be a valid UUID'),
  amount: z.number().int('Amount must be a whole number').positive('Amount must be positive'),
  period: z.enum(['MONTHLY', 'ANNUAL']),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
});

export const updateBudgetSchema = createBudgetSchema.partial();

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;
