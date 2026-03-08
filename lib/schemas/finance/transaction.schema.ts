import { z } from 'zod';

export const createTransactionSchema = z.object({
  accountId: z.string().uuid('Invalid account'),
  categoryId: z.string().uuid('Invalid category'),
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER_OUT', 'TRANSFER_IN']),
  amount: z.number().int().positive('Amount must be a positive integer (minor units)'),
  date: z.coerce.date(),
  description: z.string().max(500, 'Description must be 500 characters or fewer').optional(),
  reference: z.string().max(100, 'Reference must be 100 characters or fewer').optional(),
  workContext: z.enum(['EMPLOYED', 'SOLE_TRADER']).optional(),
  transferToAccountId: z.string().uuid('Invalid destination account').optional(),
});

export const updateTransactionSchema = createTransactionSchema.partial();

export const transactionFiltersSchema = z.object({
  accountId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER_OUT', 'TRANSFER_IN']).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type TransactionFilters = z.infer<typeof transactionFiltersSchema>;
