import {
  createAchievementAction,
  updateAchievementAction,
  deleteAchievementAction,
  updateFiscalYearSettingAction,
} from './achievement';

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth/auth', () => ({ authOptions: {} }));
jest.mock('@/lib/services/achievement.service', () => ({
  createAchievement: jest.fn(),
  updateAchievement: jest.fn(),
  softDeleteAchievement: jest.fn(),
}));
jest.mock('@/lib/db/prisma', () => ({
  prisma: { user: { update: jest.fn() } },
}));

import { getServerSession } from 'next-auth';
import {
  createAchievement,
  updateAchievement,
  softDeleteAchievement,
} from '@/lib/services/achievement.service';
import { prisma } from '@/lib/db/prisma';

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockCreate = createAchievement as jest.MockedFunction<typeof createAchievement>;
const mockUpdate = updateAchievement as jest.MockedFunction<typeof updateAchievement>;
const mockSoftDelete = softDeleteAchievement as jest.MockedFunction<typeof softDeleteAchievement>;
const mockUserUpdate = (prisma.user as jest.Mocked<typeof prisma.user>).update;

const userId = 'user-1';
const achievementId = 'ach-1';
const session = { user: { id: userId, email: 'test@test.com', role: 'MEMBER' }, expires: '' };

const baseAchievement = {
  id: achievementId,
  title: 'Led Q1 delivery',
  description: 'Delivered auth module ahead of schedule.',
  category: null,
  dateAchieved: null,
  impactRating: null,
  taskId: null,
  userId,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const validInput = {
  title: 'Led Q1 delivery',
  description: 'Delivered auth module ahead of schedule.',
};

beforeEach(() => jest.clearAllMocks());

describe('createAchievementAction', () => {
  it('returns error when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const result = await createAchievementAction(validInput);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.message).toMatch(/signed in/i);
  });

  it('returns validation error for empty title', async () => {
    mockGetServerSession.mockResolvedValue(session);
    const result = await createAchievementAction({ ...validInput, title: '' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.fields?.title).toBeDefined();
  });

  it('returns error when service throws (task not accessible)', async () => {
    mockGetServerSession.mockResolvedValue(session);
    mockCreate.mockRejectedValue(new Error('Task not found or not accessible.'));
    const result = await createAchievementAction(validInput);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.message).toMatch(/task not found/i);
  });

  it('creates and returns achievement on success', async () => {
    mockGetServerSession.mockResolvedValue(session);
    mockCreate.mockResolvedValue(baseAchievement);
    const result = await createAchievementAction(validInput);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.id).toBe(achievementId);
  });
});

describe('updateAchievementAction', () => {
  it('returns error when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const result = await updateAchievementAction(achievementId, { impactRating: 4 });
    expect(result.success).toBe(false);
  });

  it('returns error when achievement not found', async () => {
    mockGetServerSession.mockResolvedValue(session);
    mockUpdate.mockResolvedValue(null);
    const result = await updateAchievementAction(achievementId, { impactRating: 4 });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.message).toMatch(/not found/i);
  });

  it('updates and returns achievement on success', async () => {
    mockGetServerSession.mockResolvedValue(session);
    mockUpdate.mockResolvedValue({ ...baseAchievement, impactRating: 4 });
    const result = await updateAchievementAction(achievementId, { impactRating: 4 });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.impactRating).toBe(4);
  });
});

describe('deleteAchievementAction', () => {
  it('returns error when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);
    expect((await deleteAchievementAction(achievementId)).success).toBe(false);
  });

  it('returns error when not found', async () => {
    mockGetServerSession.mockResolvedValue(session);
    mockSoftDelete.mockResolvedValue(false);
    const result = await deleteAchievementAction(achievementId);
    expect(result.success).toBe(false);
  });

  it('returns success when deleted', async () => {
    mockGetServerSession.mockResolvedValue(session);
    mockSoftDelete.mockResolvedValue(true);
    expect((await deleteAchievementAction(achievementId)).success).toBe(true);
  });
});

describe('updateFiscalYearSettingAction', () => {
  it('returns error when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);
    expect((await updateFiscalYearSettingAction(4)).success).toBe(false);
  });

  it('returns error for out-of-range month', async () => {
    mockGetServerSession.mockResolvedValue(session);
    const r1 = await updateFiscalYearSettingAction(0);
    const r2 = await updateFiscalYearSettingAction(13);
    expect(r1.success).toBe(false);
    expect(r2.success).toBe(false);
  });

  it('updates user and returns success', async () => {
    mockGetServerSession.mockResolvedValue(session);
    mockUserUpdate.mockResolvedValue({} as never);
    const result = await updateFiscalYearSettingAction(4);
    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { id: userId },
      data: { fiscalYearStartMonth: 4 },
    });
    expect(result.success).toBe(true);
  });
});
