import {
  createNoteAction,
  updateNoteAction,
  saveDraftAction,
  deleteNoteAction,
} from './note';

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth/auth', () => ({ authOptions: {} }));
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('@/lib/services/note.service', () => ({
  createNote: jest.fn(),
  updateNote: jest.fn(),
  saveDraft: jest.fn(),
  softDeleteNote: jest.fn(),
}));

import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import {
  createNote,
  updateNote,
  saveDraft,
  softDeleteNote,
} from '@/lib/services/note.service';

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockRevalidatePath = revalidatePath as jest.MockedFunction<typeof revalidatePath>;
const mockCreate = createNote as jest.MockedFunction<typeof createNote>;
const mockUpdate = updateNote as jest.MockedFunction<typeof updateNote>;
const mockSaveDraft = saveDraft as jest.MockedFunction<typeof saveDraft>;
const mockSoftDelete = softDeleteNote as jest.MockedFunction<typeof softDeleteNote>;

const userId = 'user-1';
const noteId = 'note-1';
const session = { user: { id: userId, email: 'test@test.com', role: 'MEMBER' }, expires: '' };
const validBody = { type: 'doc', content: [] };

const baseNote = {
  id: noteId,
  title: 'My Note',
  body: validBody,
  tags: ['work'],
  taskId: null,
  userId,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => jest.clearAllMocks());

describe('createNoteAction', () => {
  it('returns error when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const result = await createNoteAction({ body: validBody });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.message).toMatch(/signed in/i);
  });

  it('returns validation error for invalid body', async () => {
    mockGetServerSession.mockResolvedValue(session);
    // @ts-expect-error — testing runtime validation
    const result = await createNoteAction({ body: null });
    expect(result.success).toBe(false);
  });

  it('returns error when service throws (task not accessible)', async () => {
    mockGetServerSession.mockResolvedValue(session);
    mockCreate.mockRejectedValue(new Error('Task not found or not accessible.'));
    const result = await createNoteAction({ body: validBody });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.message).toMatch(/task not found/i);
  });

  it('creates note and returns it on success', async () => {
    mockGetServerSession.mockResolvedValue(session);
    mockCreate.mockResolvedValue(baseNote);
    const result = await createNoteAction({ body: validBody, tags: ['work'] });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.id).toBe(noteId);
    expect(mockRevalidatePath).toHaveBeenCalledWith('/notes');
  });
});

describe('updateNoteAction', () => {
  it('returns error when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const result = await updateNoteAction(noteId, { tags: ['updated'] });
    expect(result.success).toBe(false);
  });

  it('returns error when note not found', async () => {
    mockGetServerSession.mockResolvedValue(session);
    mockUpdate.mockResolvedValue(null);
    const result = await updateNoteAction(noteId, { tags: ['updated'] });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.message).toMatch(/not found/i);
  });

  it('updates and returns note on success', async () => {
    mockGetServerSession.mockResolvedValue(session);
    mockUpdate.mockResolvedValue({ ...baseNote, tags: ['updated'] });
    const result = await updateNoteAction(noteId, { tags: ['updated'] });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.tags).toEqual(['updated']);
    expect(mockRevalidatePath).toHaveBeenCalledWith('/notes');
    // /notes/${noteId} is intentionally NOT revalidated — doing so would re-render the
    // editor RSC mid-action and trigger a Tiptap serialization error.
  });
});

describe('saveDraftAction', () => {
  it('returns error when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const result = await saveDraftAction(noteId, validBody);
    expect(result.success).toBe(false);
  });

  it('returns error when note not found', async () => {
    mockGetServerSession.mockResolvedValue(session);
    mockSaveDraft.mockResolvedValue(null);
    const result = await saveDraftAction(noteId, validBody);
    expect(result.success).toBe(false);
  });

  it('saves draft without calling revalidatePath', async () => {
    mockGetServerSession.mockResolvedValue(session);
    mockSaveDraft.mockResolvedValue(baseNote);
    const result = await saveDraftAction(noteId, validBody);
    expect(result.success).toBe(true);
    // Critical: auto-save must NOT trigger RSC re-render
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });
});

describe('deleteNoteAction', () => {
  it('returns error when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);
    expect((await deleteNoteAction(noteId)).success).toBe(false);
  });

  it('returns error when not found', async () => {
    mockGetServerSession.mockResolvedValue(session);
    mockSoftDelete.mockResolvedValue(false);
    const result = await deleteNoteAction(noteId);
    expect(result.success).toBe(false);
  });

  it('returns success when deleted', async () => {
    mockGetServerSession.mockResolvedValue(session);
    mockSoftDelete.mockResolvedValue(true);
    const result = await deleteNoteAction(noteId);
    expect(result.success).toBe(true);
    expect(mockRevalidatePath).toHaveBeenCalledWith('/notes');
  });
});
