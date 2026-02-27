import {
  createNoteSchema,
  updateNoteSchema,
  saveDraftSchema,
  noteFiltersSchema,
} from './note.schema';

const validBody = { type: 'doc', content: [] };

describe('createNoteSchema', () => {
  it('parses minimal valid input (body only)', () => {
    const result = createNoteSchema.safeParse({ body: validBody });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tags).toEqual([]);
      expect(result.data.title).toBeUndefined();
      expect(result.data.taskId).toBeUndefined();
    }
  });

  it('accepts full valid input', () => {
    const result = createNoteSchema.safeParse({
      title: 'My Note',
      body: validBody,
      tags: ['work', 'q1'],
      taskId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
  });

  it('rejects title > 200 characters', () => {
    const result = createNoteSchema.safeParse({ body: validBody, title: 'a'.repeat(201) });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.title).toBeDefined();
    }
  });

  it('accepts null title', () => {
    const result = createNoteSchema.safeParse({ body: validBody, title: null });
    expect(result.success).toBe(true);
  });

  it('rejects tag > 50 characters', () => {
    const result = createNoteSchema.safeParse({ body: validBody, tags: ['a'.repeat(51)] });
    expect(result.success).toBe(false);
  });

  it('rejects more than 20 tags', () => {
    const result = createNoteSchema.safeParse({
      body: validBody,
      tags: Array.from({ length: 21 }, (_, i) => `tag${i}`),
    });
    expect(result.success).toBe(false);
  });

  it('coerces missing tags to empty array', () => {
    const result = createNoteSchema.safeParse({ body: validBody });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.tags).toEqual([]);
  });

  it('rejects invalid taskId (non-UUID)', () => {
    const result = createNoteSchema.safeParse({ body: validBody, taskId: 'not-a-uuid' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.taskId).toBeDefined();
    }
  });

  it('accepts null taskId', () => {
    const result = createNoteSchema.safeParse({ body: validBody, taskId: null });
    expect(result.success).toBe(true);
  });
});

describe('updateNoteSchema', () => {
  it('accepts empty object (all partial)', () => {
    expect(updateNoteSchema.safeParse({}).success).toBe(true);
  });

  it('accepts partial update with just tags', () => {
    const result = updateNoteSchema.safeParse({ tags: ['updated'] });
    expect(result.success).toBe(true);
  });
});

describe('saveDraftSchema', () => {
  it('accepts valid body object', () => {
    expect(saveDraftSchema.safeParse({ body: validBody }).success).toBe(true);
  });

  it('rejects missing body', () => {
    expect(saveDraftSchema.safeParse({}).success).toBe(false);
  });
});

describe('noteFiltersSchema', () => {
  it('accepts empty object', () => {
    expect(noteFiltersSchema.safeParse({}).success).toBe(true);
  });

  it('accepts tag only', () => {
    const r = noteFiltersSchema.safeParse({ tag: 'work' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.tag).toBe('work');
  });

  it('accepts taskId only', () => {
    const r = noteFiltersSchema.safeParse({ taskId: '550e8400-e29b-41d4-a716-446655440000' });
    expect(r.success).toBe(true);
  });

  it('rejects invalid taskId UUID', () => {
    expect(noteFiltersSchema.safeParse({ taskId: 'bad' }).success).toBe(false);
  });
});
