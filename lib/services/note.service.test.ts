import { prisma } from '@/lib/db/prisma';
import * as taskService from '@/lib/services/task.service';
import { noteFiltersSchema } from '@/lib/schemas/note.schema';
import {
  getNotesByUser,
  getNotesByUserPaged,
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
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock('@/lib/services/task.service', () => ({
  getTaskById: jest.fn(),
}));

const mockNote = prisma.note as jest.Mocked<typeof prisma.note>;
const mockGetTaskById = taskService.getTaskById as jest.MockedFunction<typeof taskService.getTaskById>;
const mockPrismaTransaction = prisma.$transaction as jest.MockedFunction<typeof prisma.$transaction>;

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

    await getNotesByUser(userId, noteFiltersSchema.parse({ tag: 'work' }));

    expect(mockNote.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tags: { has: 'work' } }),
      }),
    );
  });

  it('applies taskId filter', async () => {
    mockNote.findMany.mockResolvedValue([]);

    await getNotesByUser(userId, noteFiltersSchema.parse({ taskId }));

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

  it('uses empty array default when tags not provided', async () => {
    mockNote.create.mockResolvedValue(baseNote as never);

    await createNote(userId, { body: validBody });

    expect(mockNote.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ tags: [] }) }),
    );
  });

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

  it('omits title from update data when title is undefined', async () => {
    const withTask = { ...baseNote, task: null };
    mockNote.findFirst.mockResolvedValue(withTask as never);
    mockNote.update.mockResolvedValue(baseNote as never);

    // Pass only tags — title and body are undefined, so they should NOT appear in data
    await updateNote(userId, noteId, { tags: ['q2'] });

    const updateCall = mockNote.update.mock.calls[0][0] as { data: Record<string, unknown> };
    expect(updateCall.data).not.toHaveProperty('title');
    expect(updateCall.data).not.toHaveProperty('body');
    expect(updateCall.data).toHaveProperty('tags');
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

describe('getNotesByUserPaged', () => {
  const defaultFilters = noteFiltersSchema.parse({});
  const withTask = { ...baseNote, task: null };

  function mockPagedTransaction(notes: object[], total: number) {
    mockPrismaTransaction.mockResolvedValue([notes, total] as never);
  }

  it('returns paged notes with total, page, pageSize, totalPages', async () => {
    mockPagedTransaction([withTask], 1);

    const result = await getNotesByUserPaged(userId, defaultFilters);

    expect(result.notes).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
    expect(result.totalPages).toBe(1);
  });

  it('applies tag filter', async () => {
    mockPagedTransaction([], 0);

    await getNotesByUserPaged(userId, noteFiltersSchema.parse({ tag: 'work' }));

    expect(mockPrismaTransaction).toHaveBeenCalledTimes(1);
  });

  it('applies taskId filter', async () => {
    mockPagedTransaction([], 0);

    await getNotesByUserPaged(userId, noteFiltersSchema.parse({ taskId }));

    expect(mockPrismaTransaction).toHaveBeenCalledTimes(1);
  });

  it('sorts by updatedAt desc by default', async () => {
    mockPagedTransaction([withTask], 1);

    const result = await getNotesByUserPaged(userId, noteFiltersSchema.parse({ sortBy: 'updatedAt', sortOrder: 'desc' }));

    expect(result.notes).toHaveLength(1);
  });

  it('sorts by createdAt desc', async () => {
    mockPagedTransaction([withTask], 1);

    const result = await getNotesByUserPaged(userId, noteFiltersSchema.parse({ sortBy: 'createdAt', sortOrder: 'desc' }));

    expect(result.notes).toHaveLength(1);
  });

  it('page 2 offsets correctly', async () => {
    mockPagedTransaction([withTask], 25);

    const result = await getNotesByUserPaged(userId, noteFiltersSchema.parse({ page: 2, pageSize: 20 }));

    expect(result.page).toBe(2);
    expect(result.total).toBe(25);
    expect(result.totalPages).toBe(2);
  });

  it('totalPages rounds up — 21 items / 20 per page = 2 pages', async () => {
    mockPagedTransaction([], 21);

    const result = await getNotesByUserPaged(userId, noteFiltersSchema.parse({ pageSize: 20 }));

    expect(result.totalPages).toBe(2);
  });

  it('totalPages is at minimum 1 when total is 0', async () => {
    mockPagedTransaction([], 0);

    const result = await getNotesByUserPaged(userId, defaultFilters);

    expect(result.totalPages).toBe(1);
  });
});
