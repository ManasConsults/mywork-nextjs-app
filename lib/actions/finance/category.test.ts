import { createCategoryAction, updateCategoryAction, deleteCategoryAction } from './category';

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth/auth', () => ({ authOptions: {} }));
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('@/lib/services/finance/category.service', () => ({
  createCategory: jest.fn(),
  updateCategory: jest.fn(),
  deleteCategory: jest.fn(),
}));

import { getServerSession } from 'next-auth';
import { createCategory, updateCategory, deleteCategory } from '@/lib/services/finance/category.service';

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockCreateCategory = createCategory as jest.MockedFunction<typeof createCategory>;
const mockUpdateCategory = updateCategory as jest.MockedFunction<typeof updateCategory>;
const mockDeleteCategory = deleteCategory as jest.MockedFunction<typeof deleteCategory>;

const session = { user: { id: 'user-1', role: 'MEMBER' }, expires: '' };

const baseCategory = {
  id: 'cat-1', userId: 'user-1', name: 'Groceries', type: 'PERSONAL' as const,
  parentId: null, colour: null, createdAt: new Date(), updatedAt: new Date(),
};

const validInput = { name: 'Groceries', type: 'PERSONAL' as const };

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── createCategoryAction ─────────────────────────────────────────────────────

describe('createCategoryAction', () => {
  it('returns error when not signed in', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const result = await createCategoryAction(validInput);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.message).toBe('You must be signed in.');
    expect(mockCreateCategory).not.toHaveBeenCalled();
  });

  it('returns field errors on invalid input', async () => {
    mockGetServerSession.mockResolvedValue(session as never);
    const result = await createCategoryAction({ name: '', type: 'PERSONAL' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.fields).toBeDefined();
    expect(mockCreateCategory).not.toHaveBeenCalled();
  });

  it('creates category on valid input', async () => {
    mockGetServerSession.mockResolvedValue(session as never);
    mockCreateCategory.mockResolvedValue(baseCategory);
    const result = await createCategoryAction(validInput);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual(baseCategory);
  });

  it('returns error on service failure', async () => {
    mockGetServerSession.mockResolvedValue(session as never);
    mockCreateCategory.mockRejectedValue(new Error('DB error'));
    const result = await createCategoryAction(validInput);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.message).toBe('Failed to create category.');
  });
});

// ─── updateCategoryAction ─────────────────────────────────────────────────────

describe('updateCategoryAction', () => {
  it('returns error when not signed in', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const result = await updateCategoryAction('cat-1', { name: 'Updated' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.message).toBe('You must be signed in.');
  });

  it('returns not found when service returns null', async () => {
    mockGetServerSession.mockResolvedValue(session as never);
    mockUpdateCategory.mockResolvedValue(null);
    const result = await updateCategoryAction('cat-1', { name: 'Updated' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.message).toBe('Category not found.');
  });

  it('returns success with updated category', async () => {
    mockGetServerSession.mockResolvedValue(session as never);
    mockUpdateCategory.mockResolvedValue({ ...baseCategory, name: 'Updated' });
    const result = await updateCategoryAction('cat-1', { name: 'Updated' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBe('Updated');
  });

  it('returns error on service failure', async () => {
    mockGetServerSession.mockResolvedValue(session as never);
    mockUpdateCategory.mockRejectedValue(new Error('DB error'));
    const result = await updateCategoryAction('cat-1', { name: 'Updated' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.message).toBe('Failed to update category.');
  });
});

// ─── deleteCategoryAction ─────────────────────────────────────────────────────

describe('deleteCategoryAction', () => {
  it('returns error when not signed in', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const result = await deleteCategoryAction('cat-1');
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.message).toBe('You must be signed in.');
  });

  it('returns not found when service returns false', async () => {
    mockGetServerSession.mockResolvedValue(session as never);
    mockDeleteCategory.mockResolvedValue(false);
    const result = await deleteCategoryAction('cat-1');
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.message).toBe('Category not found.');
  });

  it('returns success when deleted', async () => {
    mockGetServerSession.mockResolvedValue(session as never);
    mockDeleteCategory.mockResolvedValue(true);
    const result = await deleteCategoryAction('cat-1');
    expect(result.success).toBe(true);
  });

  it('propagates service error message (e.g. has transactions)', async () => {
    mockGetServerSession.mockResolvedValue(session as never);
    mockDeleteCategory.mockRejectedValue(new Error('Category has transactions and cannot be deleted.'));
    const result = await deleteCategoryAction('cat-1');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe('Category has transactions and cannot be deleted.');
    }
  });
});
