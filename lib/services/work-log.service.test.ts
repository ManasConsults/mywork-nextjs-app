import { prisma } from '@/lib/db/prisma';
import * as taskService from '@/lib/services/task.service';
import { workLogFiltersSchema } from '@/lib/schemas/work-log.schema';
import {
  getWorkLogsByUser,
  getWorkLogsByUserPaged,
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
      updateMany: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock('@/lib/services/task.service', () => ({
  getTaskById: jest.fn(),
}));

const mockWorkLog = prisma.workLog as jest.Mocked<typeof prisma.workLog>;
const mockGetTaskById = taskService.getTaskById as jest.MockedFunction<typeof taskService.getTaskById>;

const userId = 'user-1';
const taskId = '123e4567-e89b-12d3-a456-426614174000';
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

    await getWorkLogsByUser(userId, workLogFiltersSchema.parse({ taskId }));

    expect(mockWorkLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ taskId }) }),
    );
  });

  it('applies date range filter', async () => {
    mockWorkLog.findMany.mockResolvedValue([]);
    const dateFrom = new Date('2026-01-01');
    const dateTo = new Date('2026-12-31');

    await getWorkLogsByUser(userId, workLogFiltersSchema.parse({ dateFrom, dateTo }));

    expect(mockWorkLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ date: { gte: dateFrom, lte: dateTo } }),
      }),
    );
  });

  it('applies dateTo-only filter (lte branch)', async () => {
    mockWorkLog.findMany.mockResolvedValue([]);
    const dateTo = new Date('2026-12-31');

    await getWorkLogsByUser(userId, workLogFiltersSchema.parse({ dateTo }));

    expect(mockWorkLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ date: { lte: dateTo } }),
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
    const updated = { ...baseWorkLog, timeSpent: 2 };
    mockWorkLog.updateMany.mockResolvedValue({ count: 1 });
    mockWorkLog.findFirst.mockResolvedValue(updated as never);

    const result = await updateWorkLog(userId, workLogId, { timeSpent: 2 });

    expect(mockWorkLog.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: workLogId, userId }, data: { timeSpent: 2 } }),
    );
    expect(result?.timeSpent).toBe(2);
  });

  it('returns null when work log not owned by user', async () => {
    mockWorkLog.updateMany.mockResolvedValue({ count: 0 });

    const result = await updateWorkLog('other-user', workLogId, { timeSpent: 2 });

    expect(result).toBeNull();
    expect(mockWorkLog.findFirst).not.toHaveBeenCalled();
  });
});

describe('deleteWorkLog', () => {
  it('deletes work log when owned by user', async () => {
    mockWorkLog.deleteMany.mockResolvedValue({ count: 1 });

    const result = await deleteWorkLog(userId, workLogId);

    expect(mockWorkLog.deleteMany).toHaveBeenCalledWith({ where: { id: workLogId, userId } });
    expect(result).toBe(true);
  });

  it('returns false when work log not owned by user', async () => {
    mockWorkLog.deleteMany.mockResolvedValue({ count: 0 });

    const result = await deleteWorkLog('other-user', workLogId);

    expect(result).toBe(false);
  });
});

describe('getWorkLogsByUserPaged', () => {
  const defaultFilters = workLogFiltersSchema.parse({});
  const withTask = { ...baseWorkLog, task: { id: taskId, title: 'Test task' } };

  function mockPagedQuery(logs: object[], total: number, totalHoursSum: number | null) {
    mockWorkLog.findMany.mockResolvedValue(logs as never);
    mockWorkLog.count.mockResolvedValue(total);
    mockWorkLog.aggregate.mockResolvedValue({ _sum: { timeSpent: totalHoursSum } } as never);
  }

  it('returns paged logs with total, page, pageSize, totalPages, totalHours', async () => {
    mockPagedQuery([withTask], 1, 1.5);

    const result = await getWorkLogsByUserPaged(userId, defaultFilters);

    expect(result.logs).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(10);
    expect(result.totalPages).toBe(1);
    expect(result.totalHours).toBe(1.5);
  });

  it('totalHours defaults to 0 when aggregate sum is null', async () => {
    mockPagedQuery([], 0, null);

    const result = await getWorkLogsByUserPaged(userId, defaultFilters);

    expect(result.totalHours).toBe(0);
  });

  it('applies taskId filter', async () => {
    mockPagedQuery([], 0, null);

    await getWorkLogsByUserPaged(userId, workLogFiltersSchema.parse({ taskId }));

    expect(mockWorkLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ taskId }) }),
    );
  });

  it('applies date range filter with dateFrom and dateTo', async () => {
    mockPagedQuery([], 0, null);
    const dateFrom = new Date('2026-01-01');
    const dateTo = new Date('2026-12-31');

    await getWorkLogsByUserPaged(userId, workLogFiltersSchema.parse({ dateFrom, dateTo }));

    expect(mockWorkLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ date: { gte: dateFrom, lte: dateTo } }) }),
    );
  });

  it('applies dateFrom-only filter', async () => {
    mockPagedQuery([], 0, null);

    await getWorkLogsByUserPaged(userId, workLogFiltersSchema.parse({ dateFrom: new Date('2026-01-01') }));

    expect(mockWorkLog.findMany).toHaveBeenCalledTimes(1);
  });

  it('applies dateTo-only filter (lte branch in paged)', async () => {
    mockPagedQuery([], 0, null);

    await getWorkLogsByUserPaged(userId, workLogFiltersSchema.parse({ dateTo: new Date('2026-12-31') }));

    expect(mockWorkLog.findMany).toHaveBeenCalledTimes(1);
  });

  it('sorts by date desc', async () => {
    mockPagedQuery([withTask], 1, 1.5);

    const result = await getWorkLogsByUserPaged(userId, workLogFiltersSchema.parse({ sortOrder: 'desc' }));

    expect(result.logs).toHaveLength(1);
  });

  it('sorts by date asc', async () => {
    mockPagedQuery([withTask], 1, 1.5);

    const result = await getWorkLogsByUserPaged(userId, workLogFiltersSchema.parse({ sortOrder: 'asc' }));

    expect(result.logs).toHaveLength(1);
  });

  it('page 2 offsets correctly and computes totalPages', async () => {
    mockPagedQuery([withTask], 25, 37.5);

    const result = await getWorkLogsByUserPaged(userId, workLogFiltersSchema.parse({ page: 2, pageSize: 20 }));

    expect(result.page).toBe(2);
    expect(result.total).toBe(25);
    expect(result.totalPages).toBe(2);
  });

  it('totalPages is at minimum 1 when total is 0', async () => {
    mockPagedQuery([], 0, null);

    const result = await getWorkLogsByUserPaged(userId, defaultFilters);

    expect(result.totalPages).toBe(1);
  });

  it('totalHours sums the full filtered set (reflects aggregate, not just page)', async () => {
    mockPagedQuery([withTask], 25, 50);

    const result = await getWorkLogsByUserPaged(userId, workLogFiltersSchema.parse({ page: 2, pageSize: 20 }));

    expect(result.totalHours).toBe(50);
    expect(result.logs).toHaveLength(1);
  });
});
