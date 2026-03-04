import { z } from 'zod';

export const ACHIEVEMENT_CATEGORIES = [
  'Leadership',
  'Delivery',
  'Innovation',
  'Collaboration',
  'Learning',
] as const;

export const createAchievementSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or fewer'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(3000, 'Description must be 3000 characters or fewer'),
  category: z.enum(ACHIEVEMENT_CATEGORIES).optional().nullable(),
  dateAchieved: z.coerce.date().optional().nullable(),
  impactRating: z.number().int().min(1).max(5).optional().nullable(),
  taskId: z.string().uuid('Invalid task ID').optional().nullable(),
});

export const updateAchievementSchema = createAchievementSchema.partial();

export const achievementFiltersSchema = z.object({
  category: z.enum(ACHIEVEMENT_CATEGORIES).optional(),
  reviewYear: z.coerce.number().int().optional(),
});

export type CreateAchievementInput = z.infer<typeof createAchievementSchema>;
export type UpdateAchievementInput = z.infer<typeof updateAchievementSchema>;
export type AchievementFilters = z.infer<typeof achievementFiltersSchema>;
