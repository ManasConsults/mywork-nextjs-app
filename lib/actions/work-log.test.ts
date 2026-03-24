import { createWorkLogAction, updateWorkLogAction, deleteWorkLogAction } from './work-log';

jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/services/work-log.service', () => ({
  createWorkLog: jest.fn(),
  updateWorkLog: jest.fn(),
  deleteWorkLog: jest.fn(),
}));

jest.mock('@/lib/auth/auth', () => ({ authOptions: {} }));

import { getServerSession } from 'next-auth';
import { createWorkLog, updateWorkLog, deleteWorkLog } from '@/lib/services/work-log.service';

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockCreateWorkLog = createWorkLog as jest.MockedFunction<typeof createWorkLog>;
const mockUpdateWorkLog = updateWorkLog as jest.MockedFunction<typeof updateWorkLog>;
const mockDeleteWorkLog = deleteWorkLog as jest.MockedFunction<typeof deleteWorkLog>;

const userId = 'user-1';
const workLogId = 'wl-1';
const taskId = '123e4567-e89b-12d3-a456-426614174000';

const session = { user: { id: userId, email: 'test@test.com', role: 'MEMBER' }, expires: '' };

const baseWorkLog = {
  id: workLogId,
  date: new Date('2026-02-25'),
  description: 'Worked on the authentication module today',
  timeSpent: 1.5,
  outcome: 'Login flow complete',
  taskId,
  userId,
  billable: false,
  clientId: null,
  billedAt: null,
  workContext: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const validInput = {
  taskId,
  date: new Date('2026-02-25'),
  description: 'Worked on the authentication module today',
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('createWorkLogAction', () => {
  it('returns error when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const result = await createWorkLogAction(validInput);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.message).toMatch(/signed in/i);
  });

  it('returns validation error for short description', async () => {
    mockGetServerSession.mockResolvedValue(session);

    const result = await createWorkLogAction({ ...validInput, description: 'Short' });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.fields?.description).toBeDefined();
  });

  it('returns error when task not accessible', async () => {
    mockGetServerSession.mockResolvedValue(session);
    mockCreateWorkLog.mockResolvedValue(null);

    const result = await createWorkLogAction(validInput);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.message).toMatch(/task not found/i);
  });

  it('creates work log and returns data on success', async () => {
    mockGetServerSession.mockResolvedValue(session);
    mockCreateWorkLog.mockResolvedValue(baseWorkLog);

    const result = await createWorkLogAction(validInput);

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.id).toBe(workLogId);
  });
});

describe('updateWorkLogAction', () => {
  it('returns error when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const result = await updateWorkLogAction(workLogId, { timeSpent: 2 });

    expect(result.success).toBe(false);
  });

  it('returns error when work log not found', async () => {
    mockGetServerSession.mockResolvedValue(session);
    mockUpdateWorkLog.mockResolvedValue(null);

    const result = await updateWorkLogAction(workLogId, { timeSpent: 2 });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.message).toMatch(/not found/i);
  });

  it('updates work log on success', async () => {
    mockGetServerSession.mockResolvedValue(session);
    mockUpdateWorkLog.mockResolvedValue({ ...baseWorkLog, timeSpent: 2 });

    const result = await updateWorkLogAction(workLogId, { timeSpent: 2 });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.timeSpent).toBe(2);
  });
});

describe('deleteWorkLogAction', () => {
  it('returns error when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const result = await deleteWorkLogAction(workLogId);

    expect(result.success).toBe(false);
  });

  it('returns error when work log not found', async () => {
    mockGetServerSession.mockResolvedValue(session);
    mockDeleteWorkLog.mockResolvedValue(false);

    const result = await deleteWorkLogAction(workLogId);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.message).toMatch(/not found/i);
  });

  it('returns success when deleted', async () => {
    mockGetServerSession.mockResolvedValue(session);
    mockDeleteWorkLog.mockResolvedValue(true);

    const result = await deleteWorkLogAction(workLogId);

    expect(result.success).toBe(true);
  });
});
