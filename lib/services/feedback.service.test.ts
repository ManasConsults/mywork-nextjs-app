/**
 * Tests for feedback.service.ts
 * Coverage gate: ≥ 90% statements AND branches
 */

import { prisma } from '@/lib/db/prisma';
import {
  createFeedbackSubmission,
  getFeedbackSubmissionsByUser,
  getAllFeedbackSubmissions,
  updateFeedbackSubmissionStatus,
  deleteFeedbackSubmission,
} from './feedback.service';

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    feedbackSubmission: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

const mockFeedbackSubmission = prisma.feedbackSubmission as jest.Mocked<typeof prisma.feedbackSubmission>;

const userId = 'user-1';
const submissionId = 'submission-1';

const baseSubmission = {
  id: submissionId,
  userId,
  type: 'FEATURE_REQUEST' as const,
  status: 'OPEN' as const,
  title: 'Add dark mode',
  description: 'It would be great to have a dark mode option.',
  module: 'Work',
  createdAt: new Date('2026-03-01T10:00:00Z'),
  updatedAt: new Date('2026-03-01T10:00:00Z'),
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── createFeedbackSubmission ─────────────────────────────────────────────────

describe('createFeedbackSubmission', () => {
  it('should create a submission with the correct userId and input fields', async () => {
    mockFeedbackSubmission.create.mockResolvedValue(baseSubmission);
    const input = {
      type: 'FEATURE_REQUEST' as const,
      title: 'Add dark mode',
      description: 'It would be great to have a dark mode option.',
      module: 'Work',
    };

    await createFeedbackSubmission(userId, input);

    expect(mockFeedbackSubmission.create).toHaveBeenCalledWith({
      data: {
        userId,
        type: 'FEATURE_REQUEST',
        title: 'Add dark mode',
        description: 'It would be great to have a dark mode option.',
        module: 'Work',
      },
    });
  });

  it('should return the created FeedbackSubmission record', async () => {
    mockFeedbackSubmission.create.mockResolvedValue(baseSubmission);
    const input = {
      type: 'FEATURE_REQUEST' as const,
      title: 'Add dark mode',
      description: 'It would be great to have a dark mode option.',
      module: 'Work',
    };

    const result = await createFeedbackSubmission(userId, input);

    expect(result).toEqual(baseSubmission);
  });

  it('should propagate prisma errors', async () => {
    mockFeedbackSubmission.create.mockRejectedValue(new Error('DB connection failed'));
    const input = {
      type: 'BUG' as const,
      title: 'Login broken',
      description: 'Cannot log in.',
      module: 'Work',
    };

    await expect(createFeedbackSubmission(userId, input)).rejects.toThrow('DB connection failed');
  });
});

// ─── getFeedbackSubmissionsByUser ─────────────────────────────────────────────

describe('getFeedbackSubmissionsByUser', () => {
  it('should return submissions for the given userId sorted by createdAt desc', async () => {
    const older = { ...baseSubmission, id: 'submission-2', createdAt: new Date('2026-02-01T10:00:00Z') };
    const newer = { ...baseSubmission, id: 'submission-1', createdAt: new Date('2026-03-01T10:00:00Z') };
    mockFeedbackSubmission.findMany.mockResolvedValue([newer, older]);

    const result = await getFeedbackSubmissionsByUser(userId);

    expect(mockFeedbackSubmission.findMany).toHaveBeenCalledWith({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('submission-1');
  });

  it('should return an empty array when the user has no submissions', async () => {
    mockFeedbackSubmission.findMany.mockResolvedValue([]);

    const result = await getFeedbackSubmissionsByUser(userId);

    expect(result).toEqual([]);
  });

  it('should not return submissions belonging to another user', async () => {
    mockFeedbackSubmission.findMany.mockResolvedValue([]);

    await getFeedbackSubmissionsByUser('other-user');

    expect(mockFeedbackSubmission.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'other-user' } }),
    );
    // Confirm the query is scoped — it would not return user-1 submissions
    const result = await getFeedbackSubmissionsByUser('other-user');
    expect(result).toEqual([]);
  });
});

// ─── getAllFeedbackSubmissions ────────────────────────────────────────────────

describe('getAllFeedbackSubmissions', () => {
  const submissionWithUser = {
    ...baseSubmission,
    user: { name: 'Alice', email: 'alice@example.com' },
  };

  it('should return all submissions when no filters are provided', async () => {
    mockFeedbackSubmission.findMany.mockResolvedValue([submissionWithUser]);

    const result = await getAllFeedbackSubmissions({});

    expect(mockFeedbackSubmission.findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true } } },
    });
    expect(result).toHaveLength(1);
  });

  it('should filter by type when type filter is provided', async () => {
    mockFeedbackSubmission.findMany.mockResolvedValue([submissionWithUser]);

    await getAllFeedbackSubmissions({ type: 'FEATURE_REQUEST' });

    expect(mockFeedbackSubmission.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { type: 'FEATURE_REQUEST' },
      }),
    );
  });

  it('should filter by status when status filter is provided', async () => {
    mockFeedbackSubmission.findMany.mockResolvedValue([submissionWithUser]);

    await getAllFeedbackSubmissions({ status: 'IN_REVIEW' });

    expect(mockFeedbackSubmission.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: 'IN_REVIEW' },
      }),
    );
  });

  it('should apply both type and status filters simultaneously', async () => {
    mockFeedbackSubmission.findMany.mockResolvedValue([submissionWithUser]);

    await getAllFeedbackSubmissions({ type: 'BUG', status: 'RESOLVED' });

    expect(mockFeedbackSubmission.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { type: 'BUG', status: 'RESOLVED' },
      }),
    );
  });

  it('should include user name and email in results', async () => {
    mockFeedbackSubmission.findMany.mockResolvedValue([submissionWithUser]);

    const result = await getAllFeedbackSubmissions({});

    expect(mockFeedbackSubmission.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: { user: { select: { name: true, email: true } } },
      }),
    );
    expect(result[0]).toHaveProperty('user');
    expect(result[0].user.email).toBe('alice@example.com');
  });

  it('should return results sorted by createdAt desc', async () => {
    mockFeedbackSubmission.findMany.mockResolvedValue([submissionWithUser]);

    await getAllFeedbackSubmissions({});

    expect(mockFeedbackSubmission.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: 'desc' } }),
    );
  });
});

// ─── updateFeedbackSubmissionStatus ──────────────────────────────────────────

describe('updateFeedbackSubmissionStatus', () => {
  it('should return null when the submission does not exist', async () => {
    mockFeedbackSubmission.findUnique.mockResolvedValue(null);

    const result = await updateFeedbackSubmissionStatus('non-existent-id', 'IN_REVIEW');

    expect(result).toBeNull();
    expect(mockFeedbackSubmission.update).not.toHaveBeenCalled();
  });

  it('should update the status and return the updated record', async () => {
    const updatedSubmission = { ...baseSubmission, status: 'IN_REVIEW' as const };
    mockFeedbackSubmission.findUnique.mockResolvedValue(baseSubmission);
    mockFeedbackSubmission.update.mockResolvedValue(updatedSubmission);

    const result = await updateFeedbackSubmissionStatus(submissionId, 'IN_REVIEW');

    expect(mockFeedbackSubmission.update).toHaveBeenCalledWith({
      where: { id: submissionId },
      data: { status: 'IN_REVIEW' },
    });
    expect(result?.status).toBe('IN_REVIEW');
  });

  it('should allow transition to any status (no restrictions in v1)', async () => {
    const resolvedSubmission = { ...baseSubmission, status: 'RESOLVED' as const };
    mockFeedbackSubmission.findUnique.mockResolvedValue(baseSubmission);
    mockFeedbackSubmission.update.mockResolvedValue(resolvedSubmission);

    const result = await updateFeedbackSubmissionStatus(submissionId, 'RESOLVED');

    expect(result?.status).toBe('RESOLVED');
  });
});

// ─── deleteFeedbackSubmission ─────────────────────────────────────────────────

describe('deleteFeedbackSubmission', () => {
  it('should return false when the submission does not exist', async () => {
    mockFeedbackSubmission.findUnique.mockResolvedValue(null);

    const result = await deleteFeedbackSubmission('non-existent-id');

    expect(result).toBe(false);
  });

  it('should hard-delete the submission and return true', async () => {
    mockFeedbackSubmission.findUnique.mockResolvedValue(baseSubmission);
    mockFeedbackSubmission.delete.mockResolvedValue(baseSubmission);

    const result = await deleteFeedbackSubmission(submissionId);

    expect(mockFeedbackSubmission.delete).toHaveBeenCalledWith({ where: { id: submissionId } });
    expect(result).toBe(true);
  });

  it('should not call prisma.delete when submission is not found', async () => {
    mockFeedbackSubmission.findUnique.mockResolvedValue(null);

    await deleteFeedbackSubmission('non-existent-id');

    expect(mockFeedbackSubmission.delete).not.toHaveBeenCalled();
  });
});
