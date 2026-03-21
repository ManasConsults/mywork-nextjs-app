import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  seedDefaultCategories,
} from './category.service';

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    category: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      createMany: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/db/prisma';

const mockFindMany = (prisma.category as jest.Mocked<typeof prisma.category>).findMany;
const mockFindFirst = (prisma.category as jest.Mocked<typeof prisma.category>).findFirst;
const mockCreate = (prisma.category as jest.Mocked<typeof prisma.category>).create;
const mockUpdate = (prisma.category as jest.Mocked<typeof prisma.category>).update;
const mockDelete = (prisma.category as jest.Mocked<typeof prisma.category>).delete;
const mockCount = (prisma.category as jest.Mocked<typeof prisma.category>).count;
const mockCreateMany = (prisma.category as jest.Mocked<typeof prisma.category>).createMany;

const userId = 'user-1';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getCategoryById', () => {
  it('returns category when found for the user', async () => {
    const cat = { id: 'cat-1', userId, name: 'Groceries', type: 'PERSONAL' as const, parentId: null, colour: null, icon: null, createdAt: new Date() };
    mockFindFirst.mockResolvedValue(cat as never);

    const result = await getCategoryById(userId, 'cat-1');

    expect(mockFindFirst).toHaveBeenCalledWith({ where: { id: 'cat-1', userId } });
    expect(result).toEqual(cat);
  });

  it('returns null when category belongs to a different user', async () => {
    mockFindFirst.mockResolvedValue(null);

    const result = await getCategoryById('other-user', 'cat-1');

    expect(result).toBeNull();
  });
});

describe('getCategories', () => {
  it('fetches top-level categories with children included', async () => {
    mockFindMany.mockResolvedValue([]);
    await getCategories(userId);
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId, parentId: null },
        include: { children: true },
      }),
    );
  });

  it('passes type filter when provided', async () => {
    mockFindMany.mockResolvedValue([]);
    await getCategories(userId, 'PERSONAL');
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId, parentId: null, type: 'PERSONAL' } }),
    );
  });
});

describe('createCategory', () => {
  it('creates a category with userId', async () => {
    const cat = { id: 'cat-1', userId, name: 'Groceries', type: 'PERSONAL' as const, parentId: null, colour: null, icon: null, createdAt: new Date() };
    mockCreate.mockResolvedValue(cat as never);
    const result = await createCategory(userId, { name: 'Groceries', type: 'PERSONAL' });
    expect(mockCreate).toHaveBeenCalledWith({ data: { name: 'Groceries', type: 'PERSONAL', userId } });
    expect(result).toEqual(cat);
  });
});

describe('updateCategory', () => {
  it('returns null when category not found', async () => {
    mockFindFirst.mockResolvedValue(null);

    const result = await updateCategory(userId, 'cat-1', { name: 'Updated' });

    expect(result).toBeNull();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('updates and returns the category when found', async () => {
    const existing = { id: 'cat-1', userId, name: 'Old', type: 'PERSONAL' as const, parentId: null, colour: null, icon: null, createdAt: new Date() };
    const updated = { ...existing, name: 'Updated' };
    mockFindFirst.mockResolvedValue(existing as never);
    mockUpdate.mockResolvedValue(updated as never);

    const result = await updateCategory(userId, 'cat-1', { name: 'Updated' });

    expect(mockUpdate).toHaveBeenCalledWith({ where: { id: 'cat-1' }, data: { name: 'Updated' } });
    expect(result?.name).toBe('Updated');
  });
});

describe('deleteCategory', () => {
  it('returns false if category not found', async () => {
    mockFindFirst.mockResolvedValue(null);
    const result = await deleteCategory(userId, 'cat-1');
    expect(result).toBe(false);
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('throws if category has transactions', async () => {
    mockFindFirst.mockResolvedValue({ id: 'cat-1', _count: { transactions: 3, children: 0 } } as never);
    await expect(deleteCategory(userId, 'cat-1')).rejects.toThrow('Cannot delete a category that has transactions');
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('throws if category has subcategories', async () => {
    mockFindFirst.mockResolvedValue({ id: 'cat-1', _count: { transactions: 0, children: 2 } } as never);
    await expect(deleteCategory(userId, 'cat-1')).rejects.toThrow('Cannot delete a category that has subcategories');
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('deletes when no transactions or children', async () => {
    mockFindFirst.mockResolvedValue({ id: 'cat-1', _count: { transactions: 0, children: 0 } } as never);
    mockDelete.mockResolvedValue({} as never);
    const result = await deleteCategory(userId, 'cat-1');
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: 'cat-1' } });
    expect(result).toBe(true);
  });
});

describe('seedDefaultCategories', () => {
  it('skips seeding if categories already exist', async () => {
    mockCount.mockResolvedValue(5);
    await seedDefaultCategories(userId, 'EMPLOYED');
    expect(mockCreateMany).not.toHaveBeenCalled();
  });

  it('seeds defaults for EMPLOYED (no Business categories)', async () => {
    mockCount.mockResolvedValue(0);
    mockCreateMany.mockResolvedValue({ count: 13 });
    await seedDefaultCategories(userId, 'EMPLOYED');
    const call = mockCreateMany.mock.calls[0][0];
    const types = (call as { data: Array<{ type: string }> }).data.map((d) => d.type);
    expect(types).not.toContain('BUSINESS');
  });

  it('seeds Business categories for SOLE_TRADER', async () => {
    mockCount.mockResolvedValue(0);
    mockCreateMany.mockResolvedValue({ count: 20 });
    await seedDefaultCategories(userId, 'SOLE_TRADER');
    const call = mockCreateMany.mock.calls[0][0];
    const types = (call as { data: Array<{ type: string }> }).data.map((d) => d.type);
    expect(types).toContain('BUSINESS');
  });
});
