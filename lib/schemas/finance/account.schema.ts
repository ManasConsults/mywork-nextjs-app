import { z } from 'zod';

export const createAccountSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or fewer'),
  type: z.enum(['CHECKING', 'SAVINGS', 'CASH', 'CREDIT', 'INVESTMENT']),
  openingBalance: z.number().int().min(0, 'Opening balance cannot be negative').default(0),
  currency: z.string().min(3).max(3).default('GBP'),
  description: z.string().max(500, 'Description must be 500 characters or fewer').optional(),
  isDefault: z.boolean().default(false),
  // Payment / banking details shown on invoices
  bankName: z.string().max(100).optional(),
  accountNumber: z.string().max(50).optional(),
  bsb: z.string().max(20).optional(),
  iban: z.string().max(34).optional(),
  swiftBic: z.string().max(11).optional(),
});

export const updateAccountSchema = createAccountSchema.partial();

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
