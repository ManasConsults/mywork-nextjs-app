import type { Note, Prisma } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';
import { getTaskById } from '@/lib/services/task.service';
import type { CreateNoteInput, UpdateNoteInput, SaveDraftInput, NoteFilters } from '@/lib/schemas/note.schema';
import { noteFiltersSchema } from '@/lib/schemas/note.schema';
import { noteDisplayTitle as _noteDisplayTitle, noteBodyPreview as _noteBodyPreview } from '@/lib/utils/note-helpers';

export type NoteWithTask = Note & {
  task: { id: string; title: string } | null;
};

export interface PagedNotes {
  notes: NoteWithTask[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Re-export pure helpers so RSC pages can import from one place
export function noteDisplayTitle(note: Pick<Note, 'title' | 'body'>): string {
  return _noteDisplayTitle(note);
}

export function noteBodyPreview(note: Pick<Note, 'body'>, maxChars = 120): string {
  return _noteBodyPreview(note, maxChars);
}

export async function getNotesByUser(
  userId: string,
  filters: NoteFilters = noteFiltersSchema.parse({}),
): Promise<NoteWithTask[]> {
  const where: Prisma.NoteWhereInput = {
    userId,
    deletedAt: null,
    ...(filters.tag ? { tags: { has: filters.tag } } : {}),
    ...(filters.taskId ? { taskId: filters.taskId } : {}),
  };

  return prisma.note.findMany({
    where,
    include: { task: { select: { id: true, title: true } } },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function getNotesByUserPaged(
  userId: string,
  filters: NoteFilters,
): Promise<PagedNotes> {
  const { tag, taskId, sortBy, sortOrder, page, pageSize } = filters;

  const where: Prisma.NoteWhereInput = {
    userId,
    deletedAt: null,
    ...(tag ? { tags: { has: tag } } : {}),
    ...(taskId ? { taskId } : {}),
  };

  const [notes, total] = await Promise.all([
    prisma.note.findMany({
      where,
      include: { task: { select: { id: true, title: true } } },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.note.count({ where }),
  ]);

  return {
    notes,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getNoteById(
  userId: string,
  id: string,
): Promise<NoteWithTask | null> {
  return prisma.note.findFirst({
    where: { id, userId, deletedAt: null },
    include: { task: { select: { id: true, title: true } } },
  });
}

export async function createNote(
  userId: string,
  data: CreateNoteInput,
): Promise<Note> {
  if (data.taskId) {
    const task = await getTaskById(userId, data.taskId);
    if (!task) throw new Error('Task not found or not accessible.');
  }

  return prisma.note.create({
    data: {
      title: data.title ?? null,
      body: data.body as Prisma.InputJsonValue,
      tags: data.tags ?? [],
      taskId: data.taskId ?? null,
      userId,
    },
  });
}

export async function updateNote(
  userId: string,
  id: string,
  data: UpdateNoteInput,
): Promise<Note | null> {
  const existing = await getNoteById(userId, id);
  if (!existing) return null;

  if (data.taskId) {
    const task = await getTaskById(userId, data.taskId);
    if (!task) throw new Error('Task not found or not accessible.');
  }

  return prisma.note.update({
    where: { id },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.body !== undefined ? { body: data.body as Prisma.InputJsonValue } : {}),
      ...(data.tags !== undefined ? { tags: data.tags } : {}),
      ...(data.taskId !== undefined ? { taskId: data.taskId } : {}),
    },
  });
}

/** Eliminates the N+1 pre-flight SELECT — auto-save hot path, called every 30s. */
export async function saveDraft(
  userId: string,
  id: string,
  data: SaveDraftInput,
): Promise<Note | null> {
  const result = await prisma.note.updateMany({
    where: { id, userId, deletedAt: null },
    data: { body: data.body as Prisma.InputJsonValue },
  });
  if (result.count === 0) return null;
  return prisma.note.findFirst({ where: { id, userId } });
}

/** Eliminates the N+1 pre-flight SELECT by folding auth into the WHERE clause. */
export async function softDeleteNote(userId: string, id: string): Promise<boolean> {
  const result = await prisma.note.updateMany({
    where: { id, userId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return result.count > 0;
}
