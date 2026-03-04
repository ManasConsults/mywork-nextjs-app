import {
  createAchievementSchema,
  updateAchievementSchema,
  achievementFiltersSchema,
} from './achievement.schema';

const validTaskId = '123e4567-e89b-12d3-a456-426614174000';

describe('createAchievementSchema', () => {
  const valid = {
    title: 'Led Q1 delivery',
    description: 'Delivered the authentication module ahead of schedule.',
  };

  it('accepts minimal valid input', () => {
    expect(createAchievementSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts full valid input', () => {
    const result = createAchievementSchema.safeParse({
      ...valid,
      category: 'Delivery',
      dateAchieved: '2026-01-15',
      impactRating: 4,
      taskId: validTaskId,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.dateAchieved).toBeInstanceOf(Date);
      expect(result.data.impactRating).toBe(4);
    }
  });

  it('rejects empty title', () => {
    const result = createAchievementSchema.safeParse({ ...valid, title: '' });
    expect(result.success).toBe(false);
  });

  it('rejects title over 200 chars', () => {
    const result = createAchievementSchema.safeParse({ ...valid, title: 'a'.repeat(201) });
    expect(result.success).toBe(false);
  });

  it('rejects empty description', () => {
    const result = createAchievementSchema.safeParse({ ...valid, description: '' });
    expect(result.success).toBe(false);
  });

  it('rejects description over 3000 chars', () => {
    const result = createAchievementSchema.safeParse({ ...valid, description: 'a'.repeat(3001) });
    expect(result.success).toBe(false);
  });

  it('rejects invalid category', () => {
    const result = createAchievementSchema.safeParse({ ...valid, category: 'Hacking' });
    expect(result.success).toBe(false);
  });

  it('rejects impactRating outside 1–5', () => {
    expect(createAchievementSchema.safeParse({ ...valid, impactRating: 0 }).success).toBe(false);
    expect(createAchievementSchema.safeParse({ ...valid, impactRating: 6 }).success).toBe(false);
  });

  it('rejects invalid taskId', () => {
    const result = createAchievementSchema.safeParse({ ...valid, taskId: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });

  it('accepts null values for optional nullable fields', () => {
    const result = createAchievementSchema.safeParse({
      ...valid,
      category: null,
      dateAchieved: null,
      impactRating: null,
      taskId: null,
    });
    expect(result.success).toBe(true);
  });
});

describe('updateAchievementSchema', () => {
  it('accepts empty object', () => {
    expect(updateAchievementSchema.safeParse({}).success).toBe(true);
  });

  it('accepts partial update', () => {
    const result = updateAchievementSchema.safeParse({ impactRating: 5 });
    expect(result.success).toBe(true);
  });
});

describe('achievementFiltersSchema', () => {
  it('accepts empty object', () => {
    expect(achievementFiltersSchema.safeParse({}).success).toBe(true);
  });

  it('accepts valid filters', () => {
    const result = achievementFiltersSchema.safeParse({ category: 'Leadership', reviewYear: 2026 });
    expect(result.success).toBe(true);
  });

  it('coerces reviewYear string to number', () => {
    const result = achievementFiltersSchema.safeParse({ reviewYear: '2026' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.reviewYear).toBe(2026);
  });

  it('rejects invalid category', () => {
    const result = achievementFiltersSchema.safeParse({ category: 'Unknown' });
    expect(result.success).toBe(false);
  });
});
