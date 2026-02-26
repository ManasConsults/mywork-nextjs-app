import { prisma } from '@/lib/db/prisma';
import * as taskService from '@/lib/services/task.service';
import {
  getAchievementsByUser,
  getAchievementById,
  createAchievement,
  updateAchievement,
  softDeleteAchievement,
} from './achievement.service';

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    achievement: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('@/lib/services/task.service', () => ({
  getTaskById: jest.fn(),
}));

const mockAchievement = prisma.achievement as jest.Mocked<typeof prisma.achievement>;
const mockGetTaskById = taskService.getTaskById as jest.MockedFunction<typeof taskService.getTaskById>;

const userId = 'user-1';
const achievementId = 'ach-1';
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

const baseAchievement = {
  id: achievementId,
  title: 'Led Q1 delivery',
  description: 'Delivered auth module ahead of schedule.',
  category: 'Delivery',
  dateAchieved: new Date('2026-01-15'),
  impactRating: 4,
  taskId: null,
  userId,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getAchievementsByUser', () => {
  it('fetches with userId and deletedAt: null', async () => {
    const withTask = [{ ...baseAchievement, task: null }];
    mockAchievement.findMany.mockResolvedValue(withTask as never);

    const result = await getAchievementsByUser(userId);

    expect(mockAchievement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId, deletedAt: null }),
      }),
    );
    expect(result).toEqual(withTask);
  });

  it('applies category filter', async () => {
    mockAchievement.findMany.mockResolvedValue([]);

    await getAchievementsByUser(userId, { category: 'Leadership' });

    expect(mockAchievement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ category: 'Leadership' }),
      }),
    );
  });

  it('applies fiscal year date range when reviewYear provided', async () => {
    mockAchievement.findMany.mockResolvedValue([]);

    await getAchievementsByUser(userId, { reviewYear: 2026 }, 4);

    const call = mockAchievement.findMany.mock.calls[0][0] as { where: { dateAchieved?: { gte: Date; lte: Date } } };
    expect(call.where.dateAchieved).toBeDefined();
    expect(call.where.dateAchieved?.gte.getFullYear()).toBe(2025); // Apr 2025
    expect(call.where.dateAchieved?.lte.getFullYear()).toBe(2026); // Mar 2026
  });
});

describe('getAchievementById', () => {
  it('returns achievement for correct user', async () => {
    mockAchievement.findFirst.mockResolvedValue(baseAchievement as never);

    const result = await getAchievementById(userId, achievementId);

    expect(mockAchievement.findFirst).toHaveBeenCalledWith({
      where: { id: achievementId, userId, deletedAt: null },
    });
    expect(result).toEqual(baseAchievement);
  });

  it('returns null for wrong user', async () => {
    mockAchievement.findFirst.mockResolvedValue(null);

    const result = await getAchievementById('other-user', achievementId);

    expect(result).toBeNull();
  });
});

describe('createAchievement', () => {
  const input = {
    title: 'Led Q1 delivery',
    description: 'Delivered auth module ahead of schedule.',
  };

  it('creates achievement without task', async () => {
    mockAchievement.create.mockResolvedValue(baseAchievement as never);

    const result = await createAchievement(userId, input);

    expect(mockAchievement.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ ...input, userId }),
    });
    expect(result).toEqual(baseAchievement);
  });

  it('verifies task ownership when taskId provided', async () => {
    mockGetTaskById.mockResolvedValue(baseTask);
    mockAchievement.create.mockResolvedValue({ ...baseAchievement, taskId } as never);

    await createAchievement(userId, { ...input, taskId });

    expect(mockGetTaskById).toHaveBeenCalledWith(userId, taskId);
  });

  it('throws when task not owned by user', async () => {
    mockGetTaskById.mockResolvedValue(null);

    await expect(createAchievement('other-user', { ...input, taskId })).rejects.toThrow(
      /task not found/i,
    );
    expect(mockAchievement.create).not.toHaveBeenCalled();
  });
});

describe('updateAchievement', () => {
  it('updates when owned by user', async () => {
    mockAchievement.findFirst.mockResolvedValue(baseAchievement as never);
    const updated = { ...baseAchievement, impactRating: 5 };
    mockAchievement.update.mockResolvedValue(updated as never);

    const result = await updateAchievement(userId, achievementId, { impactRating: 5 });

    expect(mockAchievement.update).toHaveBeenCalledWith({
      where: { id: achievementId },
      data: { impactRating: 5 },
    });
    expect(result?.impactRating).toBe(5);
  });

  it('returns null when not owned', async () => {
    mockAchievement.findFirst.mockResolvedValue(null);

    const result = await updateAchievement('other-user', achievementId, { impactRating: 5 });

    expect(result).toBeNull();
    expect(mockAchievement.update).not.toHaveBeenCalled();
  });
});

describe('softDeleteAchievement', () => {
  it('sets deletedAt when owned by user', async () => {
    mockAchievement.findFirst.mockResolvedValue(baseAchievement as never);
    mockAchievement.update.mockResolvedValue({ ...baseAchievement, deletedAt: new Date() } as never);

    const result = await softDeleteAchievement(userId, achievementId);

    expect(mockAchievement.update).toHaveBeenCalledWith({
      where: { id: achievementId },
      data: { deletedAt: expect.any(Date) },
    });
    expect(result).toBe(true);
  });

  it('returns false when not owned', async () => {
    mockAchievement.findFirst.mockResolvedValue(null);

    const result = await softDeleteAchievement('other-user', achievementId);

    expect(result).toBe(false);
    expect(mockAchievement.update).not.toHaveBeenCalled();
  });
});
