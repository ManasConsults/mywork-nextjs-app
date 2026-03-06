import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().max(100, 'Name must be 100 characters or fewer').optional().nullable(),
  image: z
    .string()
    .url('Image must be a valid URL')
    .or(z.literal(''))
    .optional()
    .nullable(),
});

export const updateSettingsSchema = z.object({
  fiscalYearStartMonth: z
    .number()
    .int()
    .min(1, 'Month must be between 1 and 12')
    .max(12, 'Month must be between 1 and 12'),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const updateEmploymentTypeSchema = z.object({
  employmentType: z.enum(['EMPLOYED', 'SOLE_TRADER', 'BOTH']),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateEmploymentTypeInput = z.infer<typeof updateEmploymentTypeSchema>;
