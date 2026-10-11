import { z } from 'zod';

export const deleteAccountSchema = z.object({
  confirmation: z.string().min(1, 'Enter your password or email to confirm'),
  acknowledged: z.literal(true, { error: 'Confirm that you understand your account will be permanently deleted after the 14-day period' }),
});

export type DeleteAccountInput = z.input<typeof deleteAccountSchema>;
