import { prisma } from '@/lib/db/prisma';
import * as taskService from '@/lib/services/task.service';
import {
  getNotesByUser,
  getNoteById,
  createNote,
  updateNote,
  saveDraft,
  softDeleteNote,
  noteDisplayTitle,
  noteBodyPreview,
} from './note.service';

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    note: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('@/lib/services/task.service', () => ({
  getTaskById: jest.fn(),
}));

const mockNote = prisma.note as jest.Mocked<typeof prisma.note>;
const mockGetTaskById = taskService.getTaskById as jest.MockedFunction<typeof taskService.getTaskById>;

const userId = 'user-1';
const noteId = 'note-1';
const taskId = '123e4567-e89b-12d3-a456-426614174000';

const baseTask = {
  id: taskId,
  title: 'Auth task',
  description: null,
  status: 'BACKLOG' as const,
  priority: 'MEDIUM' as const,
  dueDate: null,
  tags: [],
  userId,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const validBody = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello world' }] }] };

const baseNote = {
  id: noteId,
  title: 'My Note',
  body: validBody,
  tags: ['work', 'q1'],
  taskId: null,
  userId,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => jest.clearAllMocks());

// ─── Pure function tests ───────────────────────────────────────────────────

describe('noteDisplayTitle', () => {
  it('returns explicit title when set', () => {
    expect(noteDisplayTitle({ title: 'My Title', body: validBody })).toBe('My Title');
  });

  it('extracts text from body when no title', () => {
    expect(noteDisplayTitle({ title: null, body: validBody })).toBe('Hello world');
  });

  it('truncates extracted text to 60 chars', () => {
    const longText = 'a'.repeat(80);
    const body = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: longText }] }] };
    const result = noteDisplayTitle({ title: null, body });
    expect(result).toHaveLength(60);
  });

  it('returns "Untitled" for empty body', () => {
    const emptyBody = { type: 'doc', content: [] };
    expect(noteDisplayTitle({ title: null, body: emptyBody })).toBe('Untitled');
  });
});

describe('noteBodyPreview', () => {
  it('returns plain text from body', () => {
    expect(noteBodyPreview({ body: validBody })).toBe('Hello world');
  });

  it('truncates at maxChars', () => {
    const longText = 'b'.repeat(200);
    const body = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: longText }] }] };
    expect(noteBodyPreview({ body }, 50)).toHaveLength(50);
  });

  it('returns empty string for empty body', () => {
    expect(noteBodyPreview({ body: { type: 'doc', content: [] } })).toBe('');
  });
});

// ─── Service tests ─────────────────────────────────────────────────────────

describe('getNotesByUser', () => {
  it('fetches with userId and deletedAt: null', async () => {
    const withTask = [{ ...baseNote, task: null }];
    mockNote.findMany.mockResolvedValue(withTask as never);

    const result = await getNotesByUser(userId);

    expect(mockNote.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId, deletedAt: null }),
      }),
    );
    expect(result).toEqual(withTask);
  });

  it('applies tag filter using { has: tag }', async () => {
    mockNote.findMany.mockResolvedValue([]);

    await getNotesByUser(userId, { tag: 'work' });

    expect(mockNote.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tags: { has: 'work' } }),
      }),
    );
  });

  it('applies taskId filter', async () => {
    mockNote.findMany.mockResolvedValue([]);

    await getNotesByUser(userId, { taskId });

    expect(mockNote.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ taskId }),
      }),
    );
  });
});

describe('getNoteById', () => {
  it('returns note for correct user', async () => {
    const withTask = { ...baseNote, task: null };
    mockNote.findFirst.mockResolvedValue(withTask as never);

    const result = await getNoteById(userId, noteId);

    expect(mockNote.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: noteId, userId, deletedAt: null },
      }),
    );
    expect(result).toEqual(withTask);
  });

  it('returns null for wrong user', async () => {
    mockNote.findFirst.mockResolvedValue(null);
    expect(await getNoteById('other', noteId)).toBeNull();
  });
});

describe('createNote', () => {
  const input = { body: validBody, tags: ['work'] };

  it('creates note without task', async () => {
    mockNote.create.mockResolvedValue(baseNote as never);

    const result = await createNote(userId, input);

    expect(mockNote.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ userId, tags: ['work'] }),
    });
    expect(result).toEqual(baseNote);
  });

  it('verifies task ownership when taskId provided', async () => {
    mockGetTaskById.mockResolvedValue(baseTask);
    mockNote.create.mockResolvedValue({ ...baseNote, taskId } as never);

    await createNote(userId, { ...input, taskId });

    expect(mockGetTaskById).toHaveBeenCalledWith(userId, taskId);
  });

  it('throws when task not owned by user', async () => {
    mockGetTaskById.mockResolvedValue(null);

    await expect(createNote(userId, { ...input, taskId })).rejects.toThrow(/task not found/i);
    expect(mockNote.create).not.toHaveBeenCalled();
  });
});

describe('updateNote', () => {
  it('updates when owned by user', async () => {
    const withTask = { ...baseNote, task: null };
    mockNote.findFirst.mockResolvedValue(withTask as never);
    mockNote.update.mockResolvedValue({ ...baseNote, tags: ['updated'] } as never);

    const result = await updateNote(userId, noteId, { tags: ['updated'] });

    expect(mockNote.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: noteId }, data: { tags: ['updated'] } }),
    );
    expect(result?.tags).toEqual(['updated']);
  });

  it('returns null when not owned', async () => {
    mockNote.findFirst.mockResolvedValue(null);

    const result = await updateNote('other', noteId, { tags: ['x'] });

    expect(result).toBeNull();
    expect(mockNote.update).not.toHaveBeenCalled();
  });

  it('re-checks task ownership when taskId provided', async () => {
    const withTask = { ...baseNote, task: null };
    mockNote.findFirst.mockResolvedValue(withTask as never);
    mockGetTaskById.mockResolvedValue(baseTask);
    mockNote.update.mockResolvedValue({ ...baseNote, taskId } as never);

    await updateNote(userId, noteId, { taskId });

    expect(mockGetTaskById).toHaveBeenCalledWith(userId, taskId);
  });

  it('throws when new taskId not owned', async () => {
    const withTask = { ...baseNote, task: null };
    mockNote.findFirst.mockResolvedValue(withTask as never);
    mockGetTaskById.mockResolvedValue(null);

    await expect(updateNote(userId, noteId, { taskId })).rejects.toThrow(/task not found/i);
  });
});

describe('saveDraft', () => {
  it('updates only body field', async () => {
    const withTask = { ...baseNote, task: null };
    mockNote.findFirst.mockResolvedValue(withTask as never);
    mockNote.update.mockResolvedValue(baseNote as never);

    const newBody = { type: 'doc', content: [] };
    await saveDraft(userId, noteId, { body: newBody });

    expect(mockNote.update).toHaveBeenCalledWith({
      where: { id: noteId },
      data: { body: newBody },
    });
  });

  it('returns null when not owned', async () => {
    mockNote.findFirst.mockResolvedValue(null);

    const result = await saveDraft('other', noteId, { body: validBody });

    expect(result).toBeNull();
    expect(mockNote.update).not.toHaveBeenCalled();
  });
});

describe('softDeleteNote', () => {
  it('sets deletedAt when owned', async () => {
    const withTask = { ...baseNote, task: null };
    mockNote.findFirst.mockResolvedValue(withTask as never);
    mockNote.update.mockResolvedValue({ ...baseNote, deletedAt: new Date() } as never);

    const result = await softDeleteNote(userId, noteId);

    expect(mockNote.update).toHaveBeenCalledWith({
      where: { id: noteId },
      data: { deletedAt: expect.any(Date) },
    });
    expect(result).toBe(true);
  });

  it('returns false when not owned', async () => {
    mockNote.findFirst.mockResolvedValue(null);

    const result = await softDeleteNote('other', noteId);

    expect(result).toBe(false);
    expect(mockNote.update).not.toHaveBeenCalled();
  });
});
