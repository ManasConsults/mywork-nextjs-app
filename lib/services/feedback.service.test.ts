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
      findFirst: jest.fn(),
      count: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
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
    mockFeedbackSubmission.count.mockResolvedValue(2);

    const result = await getFeedbackSubmissionsByUser(userId);

    expect(mockFeedbackSubmission.findMany).toHaveBeenCalledWith({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: 0,
      take: 10,
    });
    expect(result.items).toHaveLength(2);
    expect(result.items[0].id).toBe('submission-1');
    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(10);
    expect(result.totalPages).toBe(1);
  });

  it('should return empty items when the user has no submissions', async () => {
    mockFeedbackSubmission.findMany.mockResolvedValue([]);
    mockFeedbackSubmission.count.mockResolvedValue(0);

    const result = await getFeedbackSubmissionsByUser(userId);

    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.totalPages).toBe(0);
  });

  it('should apply type and status filters when provided', async () => {
    mockFeedbackSubmission.findMany.mockResolvedValue([baseSubmission]);
    mockFeedbackSubmission.count.mockResolvedValue(1);

    await getFeedbackSubmissionsByUser(userId, { type: 'BUG', status: 'OPEN' });

    expect(mockFeedbackSubmission.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId, type: 'BUG', status: 'OPEN' } }),
    );
  });

  it('should paginate correctly with page and pageSize options', async () => {
    mockFeedbackSubmission.findMany.mockResolvedValue([baseSubmission]);
    mockFeedbackSubmission.count.mockResolvedValue(25);

    const result = await getFeedbackSubmissionsByUser(userId, { page: 2, pageSize: 10 });

    expect(mockFeedbackSubmission.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 }),
    );
    expect(result.page).toBe(2);
    expect(result.totalPages).toBe(3);
  });

  it('should not return submissions belonging to another user', async () => {
    mockFeedbackSubmission.findMany.mockResolvedValue([]);
    mockFeedbackSubmission.count.mockResolvedValue(0);

    const result = await getFeedbackSubmissionsByUser('other-user');

    expect(mockFeedbackSubmission.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'other-user' } }),
    );
    expect(result.items).toEqual([]);
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
    mockFeedbackSubmission.count.mockResolvedValue(1);

    const result = await getAllFeedbackSubmissions({});

    expect(mockFeedbackSubmission.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {},
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true } } },
      }),
    );
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(10);
  });

  it('should filter by type when type filter is provided', async () => {
    mockFeedbackSubmission.findMany.mockResolvedValue([submissionWithUser]);
    mockFeedbackSubmission.count.mockResolvedValue(1);

    await getAllFeedbackSubmissions({ type: 'FEATURE_REQUEST' });

    expect(mockFeedbackSubmission.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { type: 'FEATURE_REQUEST' } }),
    );
  });

  it('should filter by status when status filter is provided', async () => {
    mockFeedbackSubmission.findMany.mockResolvedValue([submissionWithUser]);
    mockFeedbackSubmission.count.mockResolvedValue(1);

    await getAllFeedbackSubmissions({ status: 'IN_REVIEW' });

    expect(mockFeedbackSubmission.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: 'IN_REVIEW' } }),
    );
  });

  it('should apply both type and status filters simultaneously', async () => {
    mockFeedbackSubmission.findMany.mockResolvedValue([submissionWithUser]);
    mockFeedbackSubmission.count.mockResolvedValue(1);

    await getAllFeedbackSubmissions({ type: 'BUG', status: 'RESOLVED' });

    expect(mockFeedbackSubmission.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { type: 'BUG', status: 'RESOLVED' } }),
    );
  });

  it('should include user name and email in results', async () => {
    mockFeedbackSubmission.findMany.mockResolvedValue([submissionWithUser]);
    mockFeedbackSubmission.count.mockResolvedValue(1);

    const result = await getAllFeedbackSubmissions({});

    expect(mockFeedbackSubmission.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: { user: { select: { name: true, email: true } } },
      }),
    );
    expect(result.items[0]).toHaveProperty('user');
    expect(result.items[0].user.email).toBe('alice@example.com');
  });

  it('should paginate correctly with page and pageSize options', async () => {
    mockFeedbackSubmission.findMany.mockResolvedValue([submissionWithUser]);
    mockFeedbackSubmission.count.mockResolvedValue(35);

    const result = await getAllFeedbackSubmissions({}, { page: 2, pageSize: 20 });

    expect(mockFeedbackSubmission.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 20 }),
    );
    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(20);
    expect(result.totalPages).toBe(2);
  });

  it('should return results sorted by createdAt desc', async () => {
    mockFeedbackSubmission.findMany.mockResolvedValue([submissionWithUser]);
    mockFeedbackSubmission.count.mockResolvedValue(1);

    await getAllFeedbackSubmissions({});

    expect(mockFeedbackSubmission.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: 'desc' } }),
    );
  });
});

// ─── updateFeedbackSubmissionStatus ──────────────────────────────────────────

describe('updateFeedbackSubmissionStatus', () => {
  it('should return null when the submission does not exist', async () => {
    mockFeedbackSubmission.updateMany.mockResolvedValue({ count: 0 });

    const result = await updateFeedbackSubmissionStatus('non-existent-id', 'IN_REVIEW');

    expect(result).toBeNull();
    expect(mockFeedbackSubmission.findFirst).not.toHaveBeenCalled();
  });

  it('should update the status and return the updated record', async () => {
    const updatedSubmission = { ...baseSubmission, status: 'IN_REVIEW' as const };
    mockFeedbackSubmission.updateMany.mockResolvedValue({ count: 1 });
    mockFeedbackSubmission.findFirst.mockResolvedValue(updatedSubmission);

    const result = await updateFeedbackSubmissionStatus(submissionId, 'IN_REVIEW');

    expect(mockFeedbackSubmission.updateMany).toHaveBeenCalledWith({
      where: { id: submissionId },
      data: { status: 'IN_REVIEW' },
    });
    expect(result?.status).toBe('IN_REVIEW');
  });

  it('should allow transition to any status (no restrictions in v1)', async () => {
    const resolvedSubmission = { ...baseSubmission, status: 'RESOLVED' as const };
    mockFeedbackSubmission.updateMany.mockResolvedValue({ count: 1 });
    mockFeedbackSubmission.findFirst.mockResolvedValue(resolvedSubmission);

    const result = await updateFeedbackSubmissionStatus(submissionId, 'RESOLVED');

    expect(result?.status).toBe('RESOLVED');
  });
});

// ─── deleteFeedbackSubmission ─────────────────────────────────────────────────

describe('deleteFeedbackSubmission', () => {
  it('should return false when the submission does not exist', async () => {
    mockFeedbackSubmission.deleteMany.mockResolvedValue({ count: 0 });

    const result = await deleteFeedbackSubmission('non-existent-id');

    expect(result).toBe(false);
  });

  it('should hard-delete the submission and return true (admin: no userId)', async () => {
    mockFeedbackSubmission.deleteMany.mockResolvedValue({ count: 1 });

    const result = await deleteFeedbackSubmission(submissionId);

    expect(mockFeedbackSubmission.deleteMany).toHaveBeenCalledWith({ where: { id: submissionId } });
    expect(result).toBe(true);
  });

  it('should scope the delete to the owner when userId is provided', async () => {
    mockFeedbackSubmission.deleteMany.mockResolvedValue({ count: 1 });

    const result = await deleteFeedbackSubmission(submissionId, userId);

    expect(mockFeedbackSubmission.deleteMany).toHaveBeenCalledWith({
      where: { id: submissionId, userId },
    });
    expect(result).toBe(true);
  });

  it('should return false when userId does not own the submission', async () => {
    mockFeedbackSubmission.deleteMany.mockResolvedValue({ count: 0 });

    const result = await deleteFeedbackSubmission(submissionId, 'other-user');

    expect(result).toBe(false);
  });
});
