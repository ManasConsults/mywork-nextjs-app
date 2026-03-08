import {
  createTimesheetEntryAction,
  updateTimesheetEntryAction,
  deleteTimesheetEntryAction,
} from './timesheet';

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth/auth', () => ({ authOptions: {} }));
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    client: { findFirst: jest.fn() },
    workLog: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db/prisma';

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockClientFindFirst = (prisma.client as jest.Mocked<typeof prisma.client>).findFirst;
const mockWorkLogCreate = (prisma.workLog as jest.Mocked<typeof prisma.workLog>).create;
const mockWorkLogFindFirst = (prisma.workLog as jest.Mocked<typeof prisma.workLog>).findFirst;
const mockWorkLogUpdate = (prisma.workLog as jest.Mocked<typeof prisma.workLog>).update;
const mockWorkLogDelete = (prisma.workLog as jest.Mocked<typeof prisma.workLog>).delete;

const session = { user: { id: 'user-1', role: 'MEMBER' }, expires: '' };
const clientId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
const workLogId = 'a3bb189e-8bf9-3888-9912-ace4e6543002';

const baseEntry = {
  id: workLogId,
  userId: 'user-1',
  clientId,
  description: 'Initial work',
  date: new Date('2026-03-01'),
  timeSpent: 120,
  billable: true,
  billedAt: null,
  taskId: null,
  outcome: null,
  workContext: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const validClient = { id: clientId, userId: 'user-1', name: 'Acme Ltd' };

const validCreateInput = {
  clientId,
  description: 'Worked on feature X',
  date: new Date('2026-03-01'),
  hours: 2,
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── createTimesheetEntryAction ───────────────────────────────────────────────

describe('createTimesheetEntryAction', () => {
  it('returns error when not signed in', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const result = await createTimesheetEntryAction(validCreateInput);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.message).toBe('You must be signed in.');
    expect(mockWorkLogCreate).not.toHaveBeenCalled();
  });

  it('returns validation error on missing description', async () => {
    mockGetServerSession.mockResolvedValue(session as never);
    const result = await createTimesheetEntryAction({ ...validCreateInput, description: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.fields?.description).toBeDefined();
    }
  });

  it('returns validation error on hours > 24', async () => {
    mockGetServerSession.mockResolvedValue(session as never);
    const result = await createTimesheetEntryAction({ ...validCreateInput, hours: 25 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.fields?.hours).toBeDefined();
    }
  });

  it('returns validation error on hours <= 0', async () => {
    mockGetServerSession.mockResolvedValue(session as never);
    const result = await createTimesheetEntryAction({ ...validCreateInput, hours: 0 });
    expect(result.success).toBe(false);
  });

  it('returns error when client not found', async () => {
    mockGetServerSession.mockResolvedValue(session as never);
    mockClientFindFirst.mockResolvedValue(null);
    const result = await createTimesheetEntryAction(validCreateInput);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.message).toBe('Client not found.');
    expect(mockWorkLogCreate).not.toHaveBeenCalled();
  });

  it('creates a billable work log with correct timeSpent in minutes', async () => {
    mockGetServerSession.mockResolvedValue(session as never);
    mockClientFindFirst.mockResolvedValue(validClient as never);
    mockWorkLogCreate.mockResolvedValue(baseEntry as never);

    const result = await createTimesheetEntryAction({ ...validCreateInput, hours: 1.5 });

    expect(result.success).toBe(true);
    expect(mockWorkLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          clientId,
          billable: true,
          timeSpent: 90, // 1.5 * 60
          description: validCreateInput.description,
        }),
      }),
    );
  });

  it('rounds fractional minutes correctly', async () => {
    mockGetServerSession.mockResolvedValue(session as never);
    mockClientFindFirst.mockResolvedValue(validClient as never);
    mockWorkLogCreate.mockResolvedValue(baseEntry as never);

    await createTimesheetEntryAction({ ...validCreateInput, hours: 0.33 });

    expect(mockWorkLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ timeSpent: 20 }), // Math.round(0.33 * 60) = 20
      }),
    );
  });
});

// ─── updateTimesheetEntryAction ───────────────────────────────────────────────

describe('updateTimesheetEntryAction', () => {
  const validUpdateInput = {
    description: 'Updated description',
    date: new Date('2026-03-02'),
    hours: 3,
  };

  it('returns error when not signed in', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const result = await updateTimesheetEntryAction(workLogId, validUpdateInput);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.message).toBe('You must be signed in.');
    expect(mockWorkLogUpdate).not.toHaveBeenCalled();
  });

  it('returns error when entry not found', async () => {
    mockGetServerSession.mockResolvedValue(session as never);
    mockWorkLogFindFirst.mockResolvedValue(null);
    const result = await updateTimesheetEntryAction(workLogId, validUpdateInput);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.message).toBe('Entry not found.');
  });

  it('blocks editing a billed entry', async () => {
    mockGetServerSession.mockResolvedValue(session as never);
    mockWorkLogFindFirst.mockResolvedValue({ ...baseEntry, billedAt: new Date() } as never);
    const result = await updateTimesheetEntryAction(workLogId, validUpdateInput);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.message).toBe('Cannot edit a billed entry.');
    expect(mockWorkLogUpdate).not.toHaveBeenCalled();
  });

  it('returns validation error on empty description', async () => {
    mockGetServerSession.mockResolvedValue(session as never);
    mockWorkLogFindFirst.mockResolvedValue(baseEntry as never);
    const result = await updateTimesheetEntryAction(workLogId, { ...validUpdateInput, description: '' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.fields?.description).toBeDefined();
    expect(mockWorkLogUpdate).not.toHaveBeenCalled();
  });

  it('returns validation error on hours > 24', async () => {
    mockGetServerSession.mockResolvedValue(session as never);
    mockWorkLogFindFirst.mockResolvedValue(baseEntry as never);
    const result = await updateTimesheetEntryAction(workLogId, { ...validUpdateInput, hours: 25 });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.fields?.hours).toBeDefined();
  });

  it('updates description, date, and timeSpent on valid input', async () => {
    mockGetServerSession.mockResolvedValue(session as never);
    mockWorkLogFindFirst.mockResolvedValue(baseEntry as never);
    mockWorkLogUpdate.mockResolvedValue({ ...baseEntry, description: 'Updated description', timeSpent: 180 } as never);

    const result = await updateTimesheetEntryAction(workLogId, validUpdateInput);

    expect(result.success).toBe(true);
    expect(mockWorkLogUpdate).toHaveBeenCalledWith({
      where: { id: workLogId },
      data: expect.objectContaining({
        description: 'Updated description',
        timeSpent: 180, // 3 * 60
        date: expect.any(Date),
      }),
    });
  });

  it('converts fractional hours to rounded minutes', async () => {
    mockGetServerSession.mockResolvedValue(session as never);
    mockWorkLogFindFirst.mockResolvedValue(baseEntry as never);
    mockWorkLogUpdate.mockResolvedValue(baseEntry as never);

    await updateTimesheetEntryAction(workLogId, { ...validUpdateInput, hours: 2.75 });

    expect(mockWorkLogUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ timeSpent: 165 }), // Math.round(2.75 * 60)
      }),
    );
  });
});

// ─── deleteTimesheetEntryAction ───────────────────────────────────────────────

describe('deleteTimesheetEntryAction', () => {
  it('returns error when not signed in', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const result = await deleteTimesheetEntryAction(workLogId);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.message).toBe('You must be signed in.');
    expect(mockWorkLogDelete).not.toHaveBeenCalled();
  });

  it('returns error when entry not found', async () => {
    mockGetServerSession.mockResolvedValue(session as never);
    mockWorkLogFindFirst.mockResolvedValue(null);
    const result = await deleteTimesheetEntryAction(workLogId);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.message).toBe('Entry not found.');
  });

  it('blocks deleting a billed entry', async () => {
    mockGetServerSession.mockResolvedValue(session as never);
    mockWorkLogFindFirst.mockResolvedValue({ ...baseEntry, billedAt: new Date() } as never);
    const result = await deleteTimesheetEntryAction(workLogId);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.message).toBe('Cannot delete a billed entry.');
    expect(mockWorkLogDelete).not.toHaveBeenCalled();
  });

  it('deletes the work log and returns success', async () => {
    mockGetServerSession.mockResolvedValue(session as never);
    mockWorkLogFindFirst.mockResolvedValue(baseEntry as never);
    mockWorkLogDelete.mockResolvedValue(baseEntry as never);

    const result = await deleteTimesheetEntryAction(workLogId);

    expect(result.success).toBe(true);
    expect(mockWorkLogDelete).toHaveBeenCalledWith({ where: { id: workLogId } });
  });

  it('only deletes entries owned by the current user', async () => {
    mockGetServerSession.mockResolvedValue(session as never);
    mockWorkLogFindFirst.mockResolvedValue(null); // not found = not owner

    const result = await deleteTimesheetEntryAction(workLogId);

    expect(result.success).toBe(false);
    // findFirst was called with userId scoping
    expect(mockWorkLogFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: 'user-1', billable: true }),
      }),
    );
  });
});
