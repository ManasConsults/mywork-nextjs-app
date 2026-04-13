/**
 * Tests for feedback.schema.ts
 * Coverage gate: ≥ 95% statements AND branches
 */

import {
  createFeedbackSchema,
  updateFeedbackStatusSchema,
  feedbackFiltersSchema,
  FEEDBACK_TYPES,
  FEEDBACK_STATUSES,
} from './feedback.schema';

// ─── createFeedbackSchema ─────────────────────────────────────────────────────

describe('createFeedbackSchema', () => {
  const valid = {
    type: 'FEATURE_REQUEST',
    title: 'Add dark mode',
    description: 'It would be great to have a dark mode option.',
    module: 'Work',
  };

  it('should accept a valid Feature Request payload', () => {
    const result = createFeedbackSchema.safeParse(valid);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('FEATURE_REQUEST');
      expect(result.data.title).toBe('Add dark mode');
    }
  });

  it('should accept a valid Bug payload', () => {
    const input = { ...valid, type: 'BUG' };

    const result = createFeedbackSchema.safeParse(input);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('BUG');
    }
  });

  it('should reject when type is missing — error "Please select a type"', () => {
    const input = { title: 'Add dark mode', description: 'Some description', module: 'Work' };

    const result = createFeedbackSchema.safeParse(input);

    expect(result.success).toBe(false);
    if (!result.success) {
      const typeErrors = result.error.flatten().fieldErrors.type;
      expect(typeErrors).toBeDefined();
      expect(typeErrors?.[0]).toContain('Please select a type');
    }
  });

  it('should reject when type is an invalid value', () => {
    const input = { ...valid, type: 'COMPLIMENT' };

    const result = createFeedbackSchema.safeParse(input);

    expect(result.success).toBe(false);
    if (!result.success) {
      const typeErrors = result.error.flatten().fieldErrors.type;
      expect(typeErrors).toBeDefined();
    }
  });

  it('should reject when title is empty — error "Title is required"', () => {
    const input = { ...valid, title: '' };

    const result = createFeedbackSchema.safeParse(input);

    expect(result.success).toBe(false);
    if (!result.success) {
      const titleErrors = result.error.flatten().fieldErrors.title;
      expect(titleErrors).toBeDefined();
      expect(titleErrors?.[0]).toContain('Title is required');
    }
  });

  it('should reject when title exceeds 200 characters — error "Title must be 200 characters or fewer"', () => {
    const input = { ...valid, title: 'A'.repeat(201) };

    const result = createFeedbackSchema.safeParse(input);

    expect(result.success).toBe(false);
    if (!result.success) {
      const titleErrors = result.error.flatten().fieldErrors.title;
      expect(titleErrors).toBeDefined();
      expect(titleErrors?.[0]).toContain('Title must be 200 characters or fewer');
    }
  });

  it('should accept title at exactly 200 characters', () => {
    const input = { ...valid, title: 'A'.repeat(200) };

    const result = createFeedbackSchema.safeParse(input);

    expect(result.success).toBe(true);
  });

  it('should reject when description is empty — error "Description is required"', () => {
    const input = { ...valid, description: '' };

    const result = createFeedbackSchema.safeParse(input);

    expect(result.success).toBe(false);
    if (!result.success) {
      const descErrors = result.error.flatten().fieldErrors.description;
      expect(descErrors).toBeDefined();
      expect(descErrors?.[0]).toContain('Description is required');
    }
  });

  it('should reject when description exceeds 2000 characters — error "Description must be 2000 characters or fewer"', () => {
    const input = { ...valid, description: 'B'.repeat(2001) };

    const result = createFeedbackSchema.safeParse(input);

    expect(result.success).toBe(false);
    if (!result.success) {
      const descErrors = result.error.flatten().fieldErrors.description;
      expect(descErrors).toBeDefined();
      expect(descErrors?.[0]).toContain('Description must be 2000 characters or fewer');
    }
  });

  it('should accept description at exactly 2000 characters', () => {
    const input = { ...valid, description: 'C'.repeat(2000) };

    const result = createFeedbackSchema.safeParse(input);

    expect(result.success).toBe(true);
  });

  it('should reject when module is empty', () => {
    const input = { ...valid, module: '' };

    const result = createFeedbackSchema.safeParse(input);

    expect(result.success).toBe(false);
    if (!result.success) {
      const moduleErrors = result.error.flatten().fieldErrors.module;
      expect(moduleErrors).toBeDefined();
    }
  });

  it('should reject when module exceeds 50 characters', () => {
    const input = { ...valid, module: 'M'.repeat(51) };

    const result = createFeedbackSchema.safeParse(input);

    expect(result.success).toBe(false);
    if (!result.success) {
      const moduleErrors = result.error.flatten().fieldErrors.module;
      expect(moduleErrors).toBeDefined();
    }
  });

  it('should accept module at exactly 50 characters', () => {
    const input = { ...valid, module: 'M'.repeat(50) };

    const result = createFeedbackSchema.safeParse(input);

    expect(result.success).toBe(true);
  });
});

// ─── updateFeedbackStatusSchema ───────────────────────────────────────────────

describe('updateFeedbackStatusSchema', () => {
  it('should accept OPEN', () => {
    const result = updateFeedbackStatusSchema.safeParse({ status: 'OPEN' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('OPEN');
    }
  });

  it('should accept IN_REVIEW', () => {
    const result = updateFeedbackStatusSchema.safeParse({ status: 'IN_REVIEW' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('IN_REVIEW');
    }
  });

  it('should accept RESOLVED', () => {
    const result = updateFeedbackStatusSchema.safeParse({ status: 'RESOLVED' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('RESOLVED');
    }
  });

  it('should reject an unknown status value', () => {
    const result = updateFeedbackStatusSchema.safeParse({ status: 'PENDING' });

    expect(result.success).toBe(false);
    if (!result.success) {
      const statusErrors = result.error.flatten().fieldErrors.status;
      expect(statusErrors).toBeDefined();
    }
  });

  it('should reject when status is missing', () => {
    const result = updateFeedbackStatusSchema.safeParse({});

    expect(result.success).toBe(false);
    if (!result.success) {
      const statusErrors = result.error.flatten().fieldErrors.status;
      expect(statusErrors).toBeDefined();
    }
  });
});

// ─── feedbackFiltersSchema ────────────────────────────────────────────────────

describe('feedbackFiltersSchema', () => {
  it('should parse successfully with no fields (all optional)', () => {
    const result = feedbackFiltersSchema.safeParse({});

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBeUndefined();
      expect(result.data.status).toBeUndefined();
    }
  });

  it('should parse a valid type filter — FEATURE_REQUEST', () => {
    const result = feedbackFiltersSchema.safeParse({ type: 'FEATURE_REQUEST' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('FEATURE_REQUEST');
    }
  });

  it('should parse a valid type filter — BUG', () => {
    const result = feedbackFiltersSchema.safeParse({ type: 'BUG' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('BUG');
    }
  });

  it('should parse a valid status filter', () => {
    const result = feedbackFiltersSchema.safeParse({ status: 'IN_REVIEW' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('IN_REVIEW');
    }
  });

  it('should parse both type and status together', () => {
    const result = feedbackFiltersSchema.safeParse({ type: 'BUG', status: 'RESOLVED' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('BUG');
      expect(result.data.status).toBe('RESOLVED');
    }
  });

  it('should reject an invalid type value', () => {
    const result = feedbackFiltersSchema.safeParse({ type: 'COMPLAINT' });

    expect(result.success).toBe(false);
  });

  it('should reject an invalid status value', () => {
    const result = feedbackFiltersSchema.safeParse({ status: 'CLOSED' });

    expect(result.success).toBe(false);
  });
});

// ─── Constants ────────────────────────────────────────────────────────────────

describe('FEEDBACK_TYPES constant', () => {
  it('should contain FEATURE_REQUEST and BUG', () => {
    expect(FEEDBACK_TYPES).toContain('FEATURE_REQUEST');
    expect(FEEDBACK_TYPES).toContain('BUG');
    expect(FEEDBACK_TYPES).toHaveLength(2);
  });
});

describe('FEEDBACK_STATUSES constant', () => {
  it('should contain OPEN, IN_REVIEW, DEFERRED, and RESOLVED', () => {
    expect(FEEDBACK_STATUSES).toContain('OPEN');
    expect(FEEDBACK_STATUSES).toContain('IN_REVIEW');
    expect(FEEDBACK_STATUSES).toContain('DEFERRED');
    expect(FEEDBACK_STATUSES).toContain('RESOLVED');
    expect(FEEDBACK_STATUSES).toHaveLength(4);
  });
});
