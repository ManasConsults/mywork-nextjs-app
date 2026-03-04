import { createTaskAction, updateTaskAction, deleteTaskAction } from './task';

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/services/task.service', () => ({
  createTask: jest.fn(),
  updateTask: jest.fn(),
  softDeleteTask: jest.fn(),
}));

jest.mock('@/lib/auth/auth', () => ({ authOptions: {} }));

import { getServerSession } from 'next-auth';
import { createTask, updateTask, softDeleteTask } from '@/lib/services/task.service';

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockCreateTask = createTask as jest.MockedFunction<typeof createTask>;
const mockUpdateTask = updateTask as jest.MockedFunction<typeof updateTask>;
const mockSoftDeleteTask = softDeleteTask as jest.MockedFunction<typeof softDeleteTask>;

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

describe('createTaskAction', () => {
  it('returns error when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const result = await createTaskAction({ title: 'Test', status: 'BACKLOG', priority: 'MEDIUM', tags: [] });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toMatch(/signed in/i);
    }
  });

  it('returns validation error for invalid input', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: userId, email: 'test@test.com', role: 'MEMBER' }, expires: '' });

    const result = await createTaskAction({ title: '', status: 'BACKLOG', priority: 'MEDIUM', tags: [] });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.fields?.title).toBeDefined();
    }
  });

  it('creates task and returns data on success', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: userId, email: 'test@test.com', role: 'MEMBER' }, expires: '' });
    mockCreateTask.mockResolvedValue(baseTask);

    const result = await createTaskAction({ title: 'Test task', status: 'BACKLOG', priority: 'MEDIUM', tags: [] });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe('Test task');
    }
  });
});

describe('updateTaskAction', () => {
  it('returns error when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const result = await updateTaskAction(taskId, { status: 'DONE' });

    expect(result.success).toBe(false);
  });

  it('returns error when task not found (ownership guard)', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: userId, email: 'test@test.com', role: 'MEMBER' }, expires: '' });
    mockUpdateTask.mockResolvedValue(null);

    const result = await updateTaskAction(taskId, { status: 'DONE' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toMatch(/not found/i);
    }
  });

  it('updates task on success', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: userId, email: 'test@test.com', role: 'MEMBER' }, expires: '' });
    mockUpdateTask.mockResolvedValue({ ...baseTask, status: 'DONE' as const });

    const result = await updateTaskAction(taskId, { status: 'DONE' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('DONE');
    }
  });
});

describe('deleteTaskAction', () => {
  it('returns error when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const result = await deleteTaskAction(taskId);

    expect(result.success).toBe(false);
  });

  it('returns error when task not found', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: userId, email: 'test@test.com', role: 'MEMBER' }, expires: '' });
    mockSoftDeleteTask.mockResolvedValue(false);

    const result = await deleteTaskAction(taskId);

    expect(result.success).toBe(false);
  });

  it('returns success when task deleted', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: userId, email: 'test@test.com', role: 'MEMBER' }, expires: '' });
    mockSoftDeleteTask.mockResolvedValue(true);

    const result = await deleteTaskAction(taskId);

    expect(result.success).toBe(true);
  });
});
