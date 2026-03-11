import { z } from 'zod';

export const createClientSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name must be 200 characters or fewer'),
  email: z.string().email('Must be a valid email address').optional(),
  phone: z.string().max(50, 'Phone must be 50 characters or fewer').optional(),
  address: z.string().max(500, 'Address must be 500 characters or fewer').optional(),
  defaultRate: z.number().int().positive('Default rate must be a positive integer').optional(),
  notes: z.string().max(1000, 'Notes must be 1000 characters or fewer').optional(),
});

export const updateClientSchema = createClientSchema.partial();

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
