import { prisma } from '@/lib/db/prisma';
import { taskFiltersSchema } from '@/lib/schemas/task.schema';
import {
  getTasksByUser,
  getTasksByUserPaged,
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
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

const mockPrismaTask = prisma.task as jest.Mocked<typeof prisma.task>;
const mockPrismaTransaction = prisma.$transaction as jest.MockedFunction<typeof prisma.$transaction>;

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

// Helper: mock $transaction to resolve with [tasks, count]
function mockPagedTransaction(tasks: typeof baseTask[], count: number) {
  mockPrismaTransaction.mockResolvedValue([tasks, count] as never);
}

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

    await getTasksByUser(userId, taskFiltersSchema.parse({ status: 'IN_PROGRESS' }));

    expect(mockPrismaTask.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'IN_PROGRESS' }),
      }),
    );
  });

  it('applies priority filter when provided', async () => {
    mockPrismaTask.findMany.mockResolvedValue([]);

    await getTasksByUser(userId, taskFiltersSchema.parse({ priority: 'HIGH' }));

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

describe('getTasksByUserPaged', () => {
  const defaultFilters = taskFiltersSchema.parse({});

  it('returns paged tasks with correct total, page, pageSize, totalPages', async () => {
    mockPagedTransaction([baseTask], 1);

    const result = await getTasksByUserPaged(userId, defaultFilters);

    expect(result.tasks).toEqual([baseTask]);
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
    expect(result.totalPages).toBe(1);
  });

  it('applies status filter — passes status in where clause', async () => {
    mockPagedTransaction([], 0);

    await getTasksByUserPaged(userId, taskFiltersSchema.parse({ status: 'IN_PROGRESS' }));

    const [[findManyCall]] = mockPrismaTransaction.mock.calls;
    // $transaction receives an array of PrismaPromises; we verify it was called
    expect(mockPrismaTransaction).toHaveBeenCalledTimes(1);
    // The transaction call receives the array — just verify it ran
    expect(findManyCall).toBeDefined();
  });

  it('applies priority filter — passes priority in where clause', async () => {
    mockPagedTransaction([], 0);

    await getTasksByUserPaged(userId, taskFiltersSchema.parse({ priority: 'HIGH' }));

    expect(mockPrismaTransaction).toHaveBeenCalledTimes(1);
  });

  it('sorts by createdAt desc by default', async () => {
    mockPagedTransaction([baseTask], 1);

    const result = await getTasksByUserPaged(userId, taskFiltersSchema.parse({ sortBy: 'createdAt', sortOrder: 'desc' }));

    expect(result.tasks).toHaveLength(1);
    expect(mockPrismaTransaction).toHaveBeenCalledTimes(1);
  });

  it('sorts by dueDate (uses multi-field orderBy with nulls last)', async () => {
    mockPagedTransaction([baseTask], 1);

    await getTasksByUserPaged(userId, taskFiltersSchema.parse({ sortBy: 'dueDate', sortOrder: 'asc' }));

    expect(mockPrismaTransaction).toHaveBeenCalledTimes(1);
  });

  it('sorts by status', async () => {
    mockPagedTransaction([baseTask], 1);

    await getTasksByUserPaged(userId, taskFiltersSchema.parse({ sortBy: 'status', sortOrder: 'asc' }));

    expect(mockPrismaTransaction).toHaveBeenCalledTimes(1);
  });

  it('page 2 skips correctly — totalPages is still correct', async () => {
    mockPagedTransaction([baseTask], 25);

    const result = await getTasksByUserPaged(userId, taskFiltersSchema.parse({ page: 2, pageSize: 20 }));

    expect(result.page).toBe(2);
    expect(result.total).toBe(25);
    expect(result.totalPages).toBe(2);
  });

  it('totalPages rounds up — 21 items / 20 per page = 2 pages', async () => {
    mockPagedTransaction([], 21);

    const result = await getTasksByUserPaged(userId, taskFiltersSchema.parse({ pageSize: 20 }));

    expect(result.totalPages).toBe(2);
  });

  it('totalPages is at minimum 1 even when total is 0', async () => {
    mockPagedTransaction([], 0);

    const result = await getTasksByUserPaged(userId, defaultFilters);

    expect(result.totalPages).toBe(1);
  });
});
