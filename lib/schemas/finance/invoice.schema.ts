import { z } from 'zod';

export const createInvoiceSchema = z.object({
  clientId: z.string().uuid('Client ID must be a valid UUID'),
  paymentAccountId: z.string().uuid().optional(),
  invoiceNumber: z.string().min(1).max(50).optional(),
  issueDate: z.coerce.date(),
  dueDate: z.coerce.date().optional(),
  notes: z.string().max(2000, 'Notes must be 2000 characters or fewer').optional(),
  taxRate: z.number().int().min(0).max(5000).default(0),
  currency: z.string().length(3).optional().default('GBP'),
});

export const updateInvoiceSchema = createInvoiceSchema.partial();

export const sendInvoiceSchema = z.object({});

export const markPaidSchema = z.object({
  paidAt: z.coerce.date().optional(),
});

// Use z.input<> so fields with .default() appear optional in the parameter type
export type CreateInvoiceInput = z.input<typeof createInvoiceSchema>;
export type CreateInvoiceData = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceInput = z.input<typeof updateInvoiceSchema>;
export type MarkPaidInput = z.infer<typeof markPaidSchema>;
