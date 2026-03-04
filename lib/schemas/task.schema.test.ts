import { createTaskSchema, updateTaskSchema, taskFiltersSchema } from './task.schema';

describe('createTaskSchema', () => {
  const valid = {
    title: 'Fix login bug',
    status: 'IN_PROGRESS' as const,
    priority: 'HIGH' as const,
  };

  it('accepts a minimal valid input', () => {
    const result = createTaskSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tags).toEqual([]);
    }
  });

  it('accepts all optional fields', () => {
    const result = createTaskSchema.safeParse({
      ...valid,
      description: 'Some description',
      dueDate: '2026-03-01',
      tags: ['bug', 'auth'],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.dueDate).toBeInstanceOf(Date);
      expect(result.data.tags).toEqual(['bug', 'auth']);
    }
  });

  it('rejects missing title', () => {
    const result = createTaskSchema.safeParse({ ...valid, title: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.title).toBeDefined();
    }
  });

  it('rejects title over 200 chars', () => {
    const result = createTaskSchema.safeParse({ ...valid, title: 'a'.repeat(201) });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.title).toBeDefined();
    }
  });

  it('rejects invalid status', () => {
    const result = createTaskSchema.safeParse({ ...valid, status: 'INVALID' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid priority', () => {
    const result = createTaskSchema.safeParse({ ...valid, priority: 'URGENT' });
    expect(result.success).toBe(false);
  });

  it('applies default status and priority when omitted', () => {
    const result = createTaskSchema.safeParse({ title: 'Test' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('BACKLOG');
      expect(result.data.priority).toBe('MEDIUM');
    }
  });
});

describe('updateTaskSchema', () => {
  it('accepts empty object (all optional)', () => {
    const result = updateTaskSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts partial update', () => {
    const result = updateTaskSchema.safeParse({ status: 'DONE' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('DONE');
    }
  });
});

describe('taskFiltersSchema', () => {
  it('accepts empty filters', () => {
    expect(taskFiltersSchema.safeParse({}).success).toBe(true);
  });

  it('accepts valid status filter', () => {
    const result = taskFiltersSchema.safeParse({ status: 'BACKLOG' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid status filter', () => {
    expect(taskFiltersSchema.safeParse({ status: 'BAD' }).success).toBe(false);
  });
});
