import { prisma } from '@/lib/db/prisma';
import {
  getTasksByUser,
  getTaskById,
  createTask,
  updateTask,
  softDeleteTask,
} from './task.service';

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    task: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const mockPrismaTask = prisma.task as jest.Mocked<typeof prisma.task>;

const userId = 'user-1';
const taskId = 'task-1';

const baseTask = {
  id: taskId,
  title: 'Test task',
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

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getTasksByUser', () => {
  it('returns tasks filtered by userId and deletedAt: null', async () => {
    mockPrismaTask.findMany.mockResolvedValue([baseTask]);

    const result = await getTasksByUser(userId);

    expect(mockPrismaTask.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ userId, deletedAt: null }) }),
    );
    expect(result).toEqual([baseTask]);
  });

  it('applies status filter when provided', async () => {
    mockPrismaTask.findMany.mockResolvedValue([]);

    await getTasksByUser(userId, { status: 'IN_PROGRESS' });

    expect(mockPrismaTask.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'IN_PROGRESS' }),
      }),
    );
  });

  it('applies priority filter when provided', async () => {
    mockPrismaTask.findMany.mockResolvedValue([]);

    await getTasksByUser(userId, { priority: 'HIGH' });

    expect(mockPrismaTask.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ priority: 'HIGH' }),
      }),
    );
  });
});

describe('getTaskById', () => {
  it('returns task when found', async () => {
    mockPrismaTask.findFirst.mockResolvedValue(baseTask);

    const result = await getTaskById(userId, taskId);

    expect(mockPrismaTask.findFirst).toHaveBeenCalledWith({
      where: { id: taskId, userId, deletedAt: null },
    });
    expect(result).toEqual(baseTask);
  });

  it('returns null when task belongs to different user', async () => {
    mockPrismaTask.findFirst.mockResolvedValue(null);

    const result = await getTaskById('other-user', taskId);

    expect(result).toBeNull();
  });
});

describe('createTask', () => {
  it('creates task with userId', async () => {
    mockPrismaTask.create.mockResolvedValue(baseTask);

    const input = { title: 'Test task', status: 'BACKLOG' as const, priority: 'MEDIUM' as const, tags: [] };
    const result = await createTask(userId, input);

    expect(mockPrismaTask.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ title: 'Test task', userId }),
    });
    expect(result).toEqual(baseTask);
  });
});

describe('updateTask', () => {
  it('updates task when ownership verified', async () => {
    mockPrismaTask.findFirst.mockResolvedValue(baseTask);
    const updated = { ...baseTask, status: 'DONE' as const };
    mockPrismaTask.update.mockResolvedValue(updated);

    const result = await updateTask(userId, taskId, { status: 'DONE' });

    expect(mockPrismaTask.update).toHaveBeenCalledWith({
      where: { id: taskId },
      data: { status: 'DONE' },
    });
    expect(result?.status).toBe('DONE');
  });

  it('returns null when task not owned by user', async () => {
    mockPrismaTask.findFirst.mockResolvedValue(null);

    const result = await updateTask('other-user', taskId, { status: 'DONE' });

    expect(result).toBeNull();
    expect(mockPrismaTask.update).not.toHaveBeenCalled();
  });
});

describe('softDeleteTask', () => {
  it('sets deletedAt when ownership verified', async () => {
    mockPrismaTask.findFirst.mockResolvedValue(baseTask);
    mockPrismaTask.update.mockResolvedValue({ ...baseTask, deletedAt: new Date() });

    const result = await softDeleteTask(userId, taskId);

    expect(mockPrismaTask.update).toHaveBeenCalledWith({
      where: { id: taskId },
      data: { deletedAt: expect.any(Date) },
    });
    expect(result).toBe(true);
  });

  it('returns false when task not owned by user', async () => {
    mockPrismaTask.findFirst.mockResolvedValue(null);

    const result = await softDeleteTask('other-user', taskId);

    expect(result).toBe(false);
    expect(mockPrismaTask.update).not.toHaveBeenCalled();
  });
});
