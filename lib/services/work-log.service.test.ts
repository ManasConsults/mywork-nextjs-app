import { prisma } from '@/lib/db/prisma';
import * as taskService from '@/lib/services/task.service';
import {
  getWorkLogsByUser,
  getWorkLogsByTask,
  createWorkLog,
  updateWorkLog,
  deleteWorkLog,
} from './work-log.service';

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    workLog: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.mock('@/lib/services/task.service', () => ({
  getTaskById: jest.fn(),
}));

const mockWorkLog = prisma.workLog as jest.Mocked<typeof prisma.workLog>;
const mockGetTaskById = taskService.getTaskById as jest.MockedFunction<typeof taskService.getTaskById>;

const userId = 'user-1';
const taskId = 'task-1';
const workLogId = 'wl-1';

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

const baseWorkLog = {
  id: workLogId,
  date: new Date('2026-02-25'),
  description: 'Worked on authentication module',
  timeSpent: 1.5,
  outcome: 'Login flow complete',
  taskId,
  userId,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getWorkLogsByUser', () => {
  it('returns work logs for the user with task info', async () => {
    const withTask = [{ ...baseWorkLog, task: { id: taskId, title: 'Test task' } }];
    mockWorkLog.findMany.mockResolvedValue(withTask as never);

    const result = await getWorkLogsByUser(userId);

    expect(mockWorkLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId }),
        include: { task: { select: { id: true, title: true } } },
        orderBy: { date: 'desc' },
      }),
    );
    expect(result).toEqual(withTask);
  });

  it('applies taskId filter', async () => {
    mockWorkLog.findMany.mockResolvedValue([]);

    await getWorkLogsByUser(userId, { taskId });

    expect(mockWorkLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ taskId }) }),
    );
  });

  it('applies date range filter', async () => {
    mockWorkLog.findMany.mockResolvedValue([]);
    const dateFrom = new Date('2026-01-01');
    const dateTo = new Date('2026-12-31');

    await getWorkLogsByUser(userId, { dateFrom, dateTo });

    expect(mockWorkLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ date: { gte: dateFrom, lte: dateTo } }),
      }),
    );
  });
});

describe('getWorkLogsByTask', () => {
  it('returns work logs ordered by date asc', async () => {
    mockWorkLog.findMany.mockResolvedValue([baseWorkLog] as never);

    const result = await getWorkLogsByTask(userId, taskId);

    expect(mockWorkLog.findMany).toHaveBeenCalledWith({
      where: { userId, taskId },
      orderBy: { date: 'asc' },
    });
    expect(result).toEqual([baseWorkLog]);
  });
});

describe('createWorkLog', () => {
  const input = {
    taskId,
    date: new Date('2026-02-25'),
    description: 'Worked on authentication module',
    timeSpent: 1.5,
  };

  it('creates work log when task belongs to user', async () => {
    mockGetTaskById.mockResolvedValue(baseTask);
    mockWorkLog.create.mockResolvedValue(baseWorkLog as never);

    const result = await createWorkLog(userId, input);

    expect(mockGetTaskById).toHaveBeenCalledWith(userId, taskId);
    expect(mockWorkLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ ...input, userId }),
    });
    expect(result).toEqual(baseWorkLog);
  });

  it('returns null when task does not belong to user', async () => {
    mockGetTaskById.mockResolvedValue(null);

    const result = await createWorkLog('other-user', input);

    expect(result).toBeNull();
    expect(mockWorkLog.create).not.toHaveBeenCalled();
  });
});

describe('updateWorkLog', () => {
  it('updates work log when owned by user', async () => {
    mockWorkLog.findFirst.mockResolvedValue(baseWorkLog as never);
    const updated = { ...baseWorkLog, timeSpent: 2 };
    mockWorkLog.update.mockResolvedValue(updated as never);

    const result = await updateWorkLog(userId, workLogId, { timeSpent: 2 });

    expect(mockWorkLog.findFirst).toHaveBeenCalledWith({ where: { id: workLogId, userId } });
    expect(mockWorkLog.update).toHaveBeenCalledWith({
      where: { id: workLogId },
      data: { timeSpent: 2 },
    });
    expect(result?.timeSpent).toBe(2);
  });

  it('returns null when work log not owned by user', async () => {
    mockWorkLog.findFirst.mockResolvedValue(null);

    const result = await updateWorkLog('other-user', workLogId, { timeSpent: 2 });

    expect(result).toBeNull();
    expect(mockWorkLog.update).not.toHaveBeenCalled();
  });
});

describe('deleteWorkLog', () => {
  it('deletes work log when owned by user', async () => {
    mockWorkLog.findFirst.mockResolvedValue(baseWorkLog as never);
    mockWorkLog.delete.mockResolvedValue(baseWorkLog as never);

    const result = await deleteWorkLog(userId, workLogId);

    expect(mockWorkLog.delete).toHaveBeenCalledWith({ where: { id: workLogId } });
    expect(result).toBe(true);
  });

  it('returns false when work log not owned by user', async () => {
    mockWorkLog.findFirst.mockResolvedValue(null);

    const result = await deleteWorkLog('other-user', workLogId);

    expect(result).toBe(false);
    expect(mockWorkLog.delete).not.toHaveBeenCalled();
  });
});
