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

export const noteFiltersSchema = z.object({
  tag: z.string().optional(),
  taskId: z.string().uuid().optional(),
});

// Use z.input<> so callers don't need to pass `tags` (it has a default)
export type CreateNoteInput = z.input<typeof createNoteSchema>;
export type UpdateNoteInput = z.input<typeof updateNoteSchema>;
export type SaveDraftInput = z.infer<typeof saveDraftSchema>;
export type NoteFilters = z.infer<typeof noteFiltersSchema>;
