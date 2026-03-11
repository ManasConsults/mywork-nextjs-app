import { createCategorySchema, updateCategorySchema } from './category.schema';

describe('createCategorySchema', () => {
  const valid = { name: 'Groceries', type: 'PERSONAL' as const };

  it('accepts valid input', () => {
    expect(createCategorySchema.safeParse(valid).success).toBe(true);
  });

  it('rejects missing name', () => {
    const result = createCategorySchema.safeParse({ type: 'PERSONAL' });
    expect(result.success).toBe(false);
  });

  it('rejects empty name', () => {
    const result = createCategorySchema.safeParse({ ...valid, name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects name over 100 characters', () => {
    const result = createCategorySchema.safeParse({ ...valid, name: 'a'.repeat(101) });
    expect(result.success).toBe(false);
  });

  it('rejects invalid type', () => {
    const result = createCategorySchema.safeParse({ ...valid, type: 'INVALID' });
    expect(result.success).toBe(false);
  });

  it('accepts all valid type values', () => {
    for (const type of ['PERSONAL', 'WORK_RELATED', 'BUSINESS'] as const) {
      expect(createCategorySchema.safeParse({ ...valid, type }).success).toBe(true);
    }
  });

  it('accepts optional parentId as uuid', () => {
    const result = createCategorySchema.safeParse({
      ...valid,
      parentId: '00000000-0000-4000-8000-000000000001',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid parentId', () => {
    const result = createCategorySchema.safeParse({ ...valid, parentId: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });
});

describe('updateCategorySchema', () => {
  it('accepts an empty object (all fields optional)', () => {
    expect(updateCategorySchema.safeParse({}).success).toBe(true);
  });

  it('accepts partial update', () => {
    expect(updateCategorySchema.safeParse({ name: 'Bills' }).success).toBe(true);
  });
});
