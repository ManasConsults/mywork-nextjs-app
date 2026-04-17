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

const SUPPORTED_CURRENCIES = [
  'GBP', 'USD', 'EUR', 'CAD', 'AUD', 'NZD', 'CHF', 'JPY',
  'SEK', 'NOK', 'DKK', 'SGD', 'HKD', 'INR',
] as const;
export type SupportedCurrency = typeof SUPPORTED_CURRENCIES[number];
export { SUPPORTED_CURRENCIES };

const THEME_COLORS = ['teal', 'blue', 'indigo', 'purple', 'rose', 'orange', 'green'] as const;

export const updateSettingsSchema = z.object({
  fiscalYearStartMonth: z
    .number()
    .int()
    .min(1, 'Month must be between 1 and 12')
    .max(12, 'Month must be between 1 and 12'),
  currency: z.enum(SUPPORTED_CURRENCIES).optional(),
  themeColor: z.enum(THEME_COLORS).optional(),
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

export const updateBusinessDetailsSchema = z.object({
  businessName: z.string().max(200).optional().nullable(),
  abn: z.string().max(20).optional().nullable(),
  businessEmail: z.string().email('Must be a valid email').optional().nullable().or(z.literal('')),
  businessPhone: z.string().max(30).optional().nullable(),
  businessAddress: z.string().max(500).optional().nullable(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateEmploymentTypeInput = z.infer<typeof updateEmploymentTypeSchema>;
export type UpdateBusinessDetailsInput = z.infer<typeof updateBusinessDetailsSchema>;
