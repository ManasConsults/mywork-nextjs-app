'use server';

import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import type { Note } from '@prisma/client';

import { authOptions } from '@/lib/auth/auth';
import { createNoteSchema, updateNoteSchema, saveDraftSchema } from '@/lib/schemas/note.schema';
import type { CreateNoteInput, UpdateNoteInput } from '@/lib/schemas/note.schema';
import {
  createNote,
  updateNote,
  saveDraft as saveDraftService,
  softDeleteNote,
} from '@/lib/services/note.service';

type NoteActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string; fields?: Record<string, string[]> } };

async function getAuthUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

export async function createNoteAction(
  input: CreateNoteInput,
): Promise<NoteActionResult<Note>> {
  const userId = await getAuthUserId();
  if (!userId) return { success: false, error: { message: 'You must be signed in.' } };

  // Sanitise body before Zod validation: strips undefined attrs that tiptap-markdown
  // may add (e.g. `tight: undefined` on list items), which React's flight protocol
  // cannot serialise and would arrive on the server as a "temporary client reference".
  const sanitised = input.body ? { ...input, body: JSON.parse(JSON.stringify(input.body)) as Record<string, unknown> } : input;
  const parsed = createNoteSchema.safeParse(sanitised);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        message: 'Validation failed.',
        fields: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      },
    };
  }

  try {
    const note = await createNote(userId, parsed.data);
    revalidatePath('/notes');
    return { success: true, data: note };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create note.';
    return { success: false, error: { message } };
  }
}

export async function updateNoteAction(
  id: string,
  input: UpdateNoteInput,
): Promise<NoteActionResult<Note>> {
  const userId = await getAuthUserId();
  if (!userId) return { success: false, error: { message: 'You must be signed in.' } };

  const sanitised = input.body ? { ...input, body: JSON.parse(JSON.stringify(input.body)) as Record<string, unknown> } : input;
  const parsed = updateNoteSchema.safeParse(sanitised);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        message: 'Validation failed.',
        fields: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      },
    };
  }

  try {
    const note = await updateNote(userId, id, parsed.data);
    if (!note) return { success: false, error: { message: 'Note not found.' } };
    revalidatePath('/notes');
    // Do NOT revalidate /notes/${id} — that would re-render the editor RSC
    // mid-action and trigger a serialization error with Tiptap's complex objects.
    // The editor holds current state locally; only the list page needs to be stale.
    return { success: true, data: note };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update note.';
    return { success: false, error: { message } };
  }
}

export async function saveDraftAction(
  id: string,
  body: Record<string, unknown>,
): Promise<NoteActionResult<void>> {
  const userId = await getAuthUserId();
  if (!userId) return { success: false, error: { message: 'You must be signed in.' } };

  const parsed = saveDraftSchema.safeParse({ body: JSON.parse(JSON.stringify(body)) });
  if (!parsed.success) return { success: false, error: { message: 'Invalid draft content.' } };

  try {
    const note = await saveDraftService(userId, id, parsed.data);
    if (!note) return { success: false, error: { message: 'Note not found.' } };
    // Intentionally no revalidatePath — auto-save must not trigger RSC re-render during editing
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: { message: 'Failed to save draft.' } };
  }
}

export async function deleteNoteAction(
  id: string,
): Promise<NoteActionResult<void>> {
  const userId = await getAuthUserId();
  if (!userId) return { success: false, error: { message: 'You must be signed in.' } };

  try {
    const deleted = await softDeleteNote(userId, id);
    if (!deleted) return { success: false, error: { message: 'Note not found.' } };
    revalidatePath('/notes');
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: { message: 'Failed to delete note.' } };
  }
}
