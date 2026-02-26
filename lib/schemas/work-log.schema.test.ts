import { createWorkLogSchema, updateWorkLogSchema, workLogFiltersSchema } from './work-log.schema';

const validTaskId = '123e4567-e89b-12d3-a456-426614174000';

describe('createWorkLogSchema', () => {
  const valid = {
    taskId: validTaskId,
    date: '2026-02-25',
    description: 'Worked on the authentication module',
  };

  it('accepts valid input', () => {
    const result = createWorkLogSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('coerces date string to Date', () => {
    const result = createWorkLogSchema.safeParse(valid);
    expect(result.success && result.data.date).toBeInstanceOf(Date);
  });

  it('accepts optional timeSpent and outcome', () => {
    const result = createWorkLogSchema.safeParse({
      ...valid,
      timeSpent: 1.5,
      outcome: 'Auth flow complete',
    });
    expect(result.success).toBe(true);
  });

  it('rejects description shorter than 10 chars', () => {
    const result = createWorkLogSchema.safeParse({ ...valid, description: 'Short' });
    expect(result.success).toBe(false);
  });

  it('rejects description longer than 2000 chars', () => {
    const result = createWorkLogSchema.safeParse({ ...valid, description: 'a'.repeat(2001) });
    expect(result.success).toBe(false);
  });

  it('rejects invalid taskId', () => {
    const result = createWorkLogSchema.safeParse({ ...valid, taskId: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });

  it('rejects zero or negative timeSpent', () => {
    expect(createWorkLogSchema.safeParse({ ...valid, timeSpent: 0 }).success).toBe(false);
    expect(createWorkLogSchema.safeParse({ ...valid, timeSpent: -1 }).success).toBe(false);
  });

  it('rejects timeSpent > 24', () => {
    const result = createWorkLogSchema.safeParse({ ...valid, timeSpent: 25 });
    expect(result.success).toBe(false);
  });

  it('rejects outcome longer than 500 chars', () => {
    const result = createWorkLogSchema.safeParse({ ...valid, outcome: 'a'.repeat(501) });
    expect(result.success).toBe(false);
  });
});

describe('updateWorkLogSchema', () => {
  it('accepts empty object (all fields optional)', () => {
    const result = updateWorkLogSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts partial update', () => {
    const result = updateWorkLogSchema.safeParse({ description: 'Updated the auth logic today' });
    expect(result.success).toBe(true);
  });
});

describe('workLogFiltersSchema', () => {
  it('accepts empty object', () => {
    expect(workLogFiltersSchema.safeParse({}).success).toBe(true);
  });

  it('accepts valid filters', () => {
    const result = workLogFiltersSchema.safeParse({
      taskId: validTaskId,
      dateFrom: '2026-01-01',
      dateTo: '2026-12-31',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid taskId', () => {
    const result = workLogFiltersSchema.safeParse({ taskId: 'bad-id' });
    expect(result.success).toBe(false);
  });
});
