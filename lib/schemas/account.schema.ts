import { z } from 'zod';

export const deleteAccountSchema = z.object({
  confirmation: z.string().min(1, 'Enter your password or email to confirm'),
  acknowledged: z.literal(true, { error: 'Confirm that you understand this cannot be undone' }),
});

export type DeleteAccountInput = z.input<typeof deleteAccountSchema>;
