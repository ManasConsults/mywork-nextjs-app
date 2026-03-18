import { z } from 'zod';

// Accept any JSON object from Tiptap — we don't validate internal Tiptap structure
const tiptapDocSchema = z.record(z.string(), z.unknown());

export const createNoteSchema = z.object({
  title: z.string().max(200, 'Title must be 200 characters or fewer').optional().nullable(),
  body: tiptapDocSchema,
  tags: z.array(z.string().max(50, 'Each tag must be 50 characters or fewer')).max(20, 'Maximum 20 tags').default([]),
  taskId: z.string().uuid('Invalid task ID').optional().nullable(),
});

export const updateNoteSchema = createNoteSchema.partial();

export const saveDraftSchema = z.object({
  body: tiptapDocSchema,
});

export const NOTE_SORT_BY = ['createdAt', 'updatedAt'] as const;
export const NOTE_PAGE_SIZES = [10, 20, 50, 100] as const;
export const NOTE_DEFAULT_PAGE_SIZE = 20;

export const noteFiltersSchema = z.object({
  tag: z.string().optional(),
  taskId: z.string().uuid().optional(),
  sortBy: z.enum(NOTE_SORT_BY).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .refine((v) => (NOTE_PAGE_SIZES as readonly number[]).includes(v), {
      message: 'Invalid page size',
    })
    .default(NOTE_DEFAULT_PAGE_SIZE),
});

// Use z.input<> so callers don't need to pass `tags` (it has a default)
export type CreateNoteInput = z.input<typeof createNoteSchema>;
export type UpdateNoteInput = z.input<typeof updateNoteSchema>;
export type SaveDraftInput = z.infer<typeof saveDraftSchema>;
export type NoteFilters = z.infer<typeof noteFiltersSchema>;
