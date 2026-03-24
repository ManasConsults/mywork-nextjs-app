import { prisma } from '@/lib/db/prisma';
import { getAppUsageStats } from './admin.service';

// ─── Prisma mock ──────────────────────────────────────────────────────────────
//
// The service runs two concurrent batches:
//   1. Promise.all([count×6, findMany×1])  — individual mocks per query
//   2. Promise.all([groupBy×5])            — individual mocks per groupBy

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    user: { count: jest.fn(), findMany: jest.fn() },
    task: { count: jest.fn(), groupBy: jest.fn() },
    workLog: { count: jest.fn(), groupBy: jest.fn() },
    achievement: { count: jest.fn(), groupBy: jest.fn() },
    note: { count: jest.fn(), groupBy: jest.fn() },
    todoItem: { count: jest.fn(), groupBy: jest.fn() },
  },
}));

const mockUserCount = prisma.user.count as jest.MockedFunction<typeof prisma.user.count>;
const mockUserFindMany = prisma.user.findMany as jest.MockedFunction<typeof prisma.user.findMany>;
const mockTaskCount = prisma.task.count as jest.MockedFunction<typeof prisma.task.count>;
const mockWorkLogCount = prisma.workLog.count as jest.MockedFunction<typeof prisma.workLog.count>;
const mockAchievementCount = prisma.achievement.count as jest.MockedFunction<typeof prisma.achievement.count>;
const mockNoteCount = prisma.note.count as jest.MockedFunction<typeof prisma.note.count>;
const mockTodoItemCount = prisma.todoItem.count as jest.MockedFunction<typeof prisma.todoItem.count>;
const mockTaskGroupBy = prisma.task.groupBy as jest.MockedFunction<typeof prisma.task.groupBy>;
const mockWorkLogGroupBy = prisma.workLog.groupBy as jest.MockedFunction<typeof prisma.workLog.groupBy>;
const mockAchievementGroupBy = prisma.achievement.groupBy as jest.MockedFunction<typeof prisma.achievement.groupBy>;
const mockNoteGroupBy = prisma.note.groupBy as jest.MockedFunction<typeof prisma.note.groupBy>;
const mockTodoItemGroupBy = prisma.todoItem.groupBy as jest.MockedFunction<typeof prisma.todoItem.groupBy>;

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const now = new Date('2026-03-21T12:00:00.000Z');
const yesterday = new Date('2026-03-20T12:00:00.000Z');
const lastWeek = new Date('2026-03-14T12:00:00.000Z');

const rawUsers = [
  {
    id: 'user-1',
    name: 'Alice Admin',
    email: 'alice@example.com',
    role: 'ADMIN',
    createdAt: lastWeek,
    _count: { tasks: 5, workLogs: 3, achievements: 2, notes: 1, todoItems: 4 },
  },
  {
    id: 'user-2',
    name: 'Bob Member',
    email: 'bob@example.com',
    role: 'MEMBER',
    createdAt: lastWeek,
    _count: { tasks: 0, workLogs: 0, achievements: 0, notes: 0, todoItems: 0 },
  },
];

beforeEach(() => {
  jest.clearAllMocks();

  // Count mocks
  mockUserCount.mockResolvedValue(2);
  mockTaskCount.mockResolvedValue(5);
  mockWorkLogCount.mockResolvedValue(3);
  mockAchievementCount.mockResolvedValue(2);
  mockNoteCount.mockResolvedValue(1);
  mockTodoItemCount.mockResolvedValue(4);
  mockUserFindMany.mockResolvedValue(rawUsers as never);

  // groupBy mocks — each resolves to the per-module per-user max-date rows
  mockTaskGroupBy.mockResolvedValue([
    { userId: 'user-1', _max: { createdAt: now } },
  ] as never);
  mockWorkLogGroupBy.mockResolvedValue([
    { userId: 'user-1', _max: { createdAt: yesterday } },
  ] as never);
  mockAchievementGroupBy.mockResolvedValue([] as never);
  mockNoteGroupBy.mockResolvedValue([] as never);
  mockTodoItemGroupBy.mockResolvedValue([] as never);
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('getAppUsageStats', () => {
  it('returns correct global totals', async () => {
    const stats = await getAppUsageStats();

    expect(stats.totalUsers).toBe(2);
    expect(stats.totalTasks).toBe(5);
    expect(stats.totalWorkLogs).toBe(3);
    expect(stats.totalAchievements).toBe(2);
    expect(stats.totalNotes).toBe(1);
    expect(stats.totalTodos).toBe(4);
  });

  it('returns one UserUsageStats row per user', async () => {
    const stats = await getAppUsageStats();
    expect(stats.users).toHaveLength(2);
  });

  it('maps per-user counts correctly', async () => {
    const stats = await getAppUsageStats();
    const alice = stats.users.find((u) => u.id === 'user-1');

    expect(alice).toBeDefined();
    expect(alice!.taskCount).toBe(5);
    expect(alice!.workLogCount).toBe(3);
    expect(alice!.achievementCount).toBe(2);
    expect(alice!.noteCount).toBe(1);
    expect(alice!.todoCount).toBe(4);
  });

  it('sets lastActiveAt to the most recent createdAt across all modules', async () => {
    const stats = await getAppUsageStats();
    const alice = stats.users.find((u) => u.id === 'user-1');
    // Task date (now) should win over workLog date (yesterday)
    expect(alice!.lastActiveAt).toEqual(now);
  });

  it('sets lastActiveAt to null for users with no records in any module', async () => {
    const stats = await getAppUsageStats();
    const bob = stats.users.find((u) => u.id === 'user-2');
    expect(bob!.lastActiveAt).toBeNull();
  });

  it('sorts users by lastActiveAt descending — null values last', async () => {
    const stats = await getAppUsageStats();
    // alice has lastActiveAt = now, bob has null → alice comes first
    expect(stats.users[0].id).toBe('user-1');
    expect(stats.users[1].id).toBe('user-2');
  });

  it('calls each count and findMany exactly once', async () => {
    await getAppUsageStats();
    expect(mockUserCount).toHaveBeenCalledTimes(1);
    expect(mockTaskCount).toHaveBeenCalledTimes(1);
    expect(mockWorkLogCount).toHaveBeenCalledTimes(1);
    expect(mockAchievementCount).toHaveBeenCalledTimes(1);
    expect(mockNoteCount).toHaveBeenCalledTimes(1);
    expect(mockTodoItemCount).toHaveBeenCalledTimes(1);
    expect(mockUserFindMany).toHaveBeenCalledTimes(1);
  });

  it('calls groupBy on each module to compute lastActiveAt', async () => {
    await getAppUsageStats();
    expect(mockTaskGroupBy).toHaveBeenCalledTimes(1);
    expect(mockWorkLogGroupBy).toHaveBeenCalledTimes(1);
    expect(mockAchievementGroupBy).toHaveBeenCalledTimes(1);
    expect(mockNoteGroupBy).toHaveBeenCalledTimes(1);
    expect(mockTodoItemGroupBy).toHaveBeenCalledTimes(1);
  });

  it('picks the later of two module dates as lastActiveAt', async () => {
    // workLog date newer than task date
    mockTaskGroupBy.mockResolvedValue([
      { userId: 'user-1', _max: { createdAt: yesterday } },
    ] as never);
    mockWorkLogGroupBy.mockResolvedValue([
      { userId: 'user-1', _max: { createdAt: now } },
    ] as never);

    const stats = await getAppUsageStats();
    const alice = stats.users.find((u) => u.id === 'user-1');
    expect(alice!.lastActiveAt).toEqual(now);
  });

  it('sorts two users both with lastActiveAt — more recent date first', async () => {
    // Give user-2 an older date so both are non-null; user-1 (now) should stay first
    mockTaskGroupBy.mockResolvedValue([
      { userId: 'user-1', _max: { createdAt: now } },
      { userId: 'user-2', _max: { createdAt: lastWeek } },
    ] as never);

    const stats = await getAppUsageStats();

    expect(stats.users[0].id).toBe('user-1');
    expect(stats.users[1].id).toBe('user-2');
  });

  it('sort comparator returns 0 when both users have null lastActiveAt', async () => {
    // Both users have no activity — order between them must be stable (both null → 0)
    mockTaskGroupBy.mockResolvedValue([] as never);
    mockWorkLogGroupBy.mockResolvedValue([] as never);
    mockAchievementGroupBy.mockResolvedValue([] as never);
    mockNoteGroupBy.mockResolvedValue([] as never);
    mockTodoItemGroupBy.mockResolvedValue([] as never);

    const stats = await getAppUsageStats();

    // Both users have null lastActiveAt — neither should be reordered, both present
    expect(stats.users.every((u) => u.lastActiveAt === null)).toBe(true);
    expect(stats.users).toHaveLength(2);
  });

  it('mergeDate ignores null/undefined candidate dates', async () => {
    // groupBy rows with null _max.createdAt should not overwrite a real date
    mockTaskGroupBy.mockResolvedValue([
      { userId: 'user-1', _max: { createdAt: null } },
    ] as never);
    mockWorkLogGroupBy.mockResolvedValue([
      { userId: 'user-1', _max: { createdAt: now } },
    ] as never);

    const stats = await getAppUsageStats();
    const alice = stats.users.find((u) => u.id === 'user-1');
    // null from task groupBy is ignored; workLog date wins
    expect(alice!.lastActiveAt).toEqual(now);
  });

  it('mergeDate keeps existing when candidate is older (does not overwrite)', async () => {
    // task=now, then achievement=lastWeek — lastWeek is older, so now should be kept
    mockTaskGroupBy.mockResolvedValue([
      { userId: 'user-1', _max: { createdAt: now } },
    ] as never);
    mockAchievementGroupBy.mockResolvedValue([
      { userId: 'user-1', _max: { createdAt: lastWeek } },
    ] as never);

    const stats = await getAppUsageStats();
    const alice = stats.users.find((u) => u.id === 'user-1');
    expect(alice!.lastActiveAt).toEqual(now);
  });

  it('mergeDate uses achievement and note dates to set lastActiveAt', async () => {
    // Only note and todo have data for user-1; task and workLog empty
    mockTaskGroupBy.mockResolvedValue([] as never);
    mockWorkLogGroupBy.mockResolvedValue([] as never);
    mockAchievementGroupBy.mockResolvedValue([
      { userId: 'user-1', _max: { createdAt: yesterday } },
    ] as never);
    mockNoteGroupBy.mockResolvedValue([
      { userId: 'user-1', _max: { createdAt: now } },
    ] as never);
    mockTodoItemGroupBy.mockResolvedValue([
      { userId: 'user-1', _max: { createdAt: lastWeek } },
    ] as never);

    const stats = await getAppUsageStats();
    const alice = stats.users.find((u) => u.id === 'user-1');
    expect(alice!.lastActiveAt).toEqual(now);
  });
});
