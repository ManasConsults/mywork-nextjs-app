import { prisma } from '@/lib/db/prisma';
import type { CreateCategoryInput, UpdateCategoryInput } from '@/lib/schemas/finance/category.schema';
import type { Category, CategoryType, EmploymentType } from '@prisma/client';

export async function getCategories(userId: string, type?: CategoryType): Promise<Category[]> {
  return prisma.category.findMany({
    where: { userId, parentId: null, ...(type ? { type } : {}) },
    include: { children: true },
    orderBy: [{ type: 'asc' }, { name: 'asc' }],
  });
}

export async function getCategoryById(userId: string, id: string): Promise<Category | null> {
  return prisma.category.findFirst({ where: { id, userId } });
}

export async function createCategory(
  userId: string,
  data: CreateCategoryInput,
): Promise<Category> {
  return prisma.category.create({ data: { ...data, userId } });
}

export async function updateCategory(
  userId: string,
  id: string,
  data: UpdateCategoryInput,
): Promise<Category | null> {
  const existing = await prisma.category.findFirst({ where: { id, userId } });
  if (!existing) return null;
  return prisma.category.update({ where: { id }, data });
}

export async function deleteCategory(userId: string, id: string): Promise<boolean> {
  const existing = await prisma.category.findFirst({
    where: { id, userId },
    include: { _count: { select: { transactions: true, children: true } } },
  });
  if (!existing) return false;
  if (existing._count.transactions > 0) {
    throw new Error('Cannot delete a category that has transactions. Re-categorise them first.');
  }
  if (existing._count.children > 0) {
    throw new Error('Cannot delete a category that has subcategories.');
  }
  await prisma.category.delete({ where: { id } });
  return true;
}

type DefaultCategory = { name: string; type: CategoryType };

const EMPLOYED_DEFAULTS: DefaultCategory[] = [
  { name: 'Groceries', type: 'PERSONAL' },
  { name: 'Dining & Takeaway', type: 'PERSONAL' },
  { name: 'Transport', type: 'PERSONAL' },
  { name: 'Utilities', type: 'PERSONAL' },
  { name: 'Entertainment', type: 'PERSONAL' },
  { name: 'Health', type: 'PERSONAL' },
  { name: 'Shopping', type: 'PERSONAL' },
  { name: 'Rent / Mortgage', type: 'PERSONAL' },
  { name: 'Salary', type: 'PERSONAL' },
  { name: 'Home Office', type: 'WORK_RELATED' },
  { name: 'Work Travel', type: 'WORK_RELATED' },
  { name: 'Professional Subscriptions', type: 'WORK_RELATED' },
  { name: 'Training & Courses', type: 'WORK_RELATED' },
];

const BUSINESS_DEFAULTS: DefaultCategory[] = [
  { name: 'Client Income', type: 'BUSINESS' },
  { name: 'Professional Fees', type: 'BUSINESS' },
  { name: 'Software & Tools', type: 'BUSINESS' },
  { name: 'Equipment', type: 'BUSINESS' },
  { name: 'Marketing', type: 'BUSINESS' },
  { name: 'Accountancy', type: 'BUSINESS' },
  { name: 'Business Travel', type: 'BUSINESS' },
];

export async function seedDefaultCategories(
  userId: string,
  employmentType: EmploymentType,
): Promise<void> {
  const existing = await prisma.category.count({ where: { userId } });
  if (existing > 0) return; // already seeded

  const defaults: DefaultCategory[] = [
    ...EMPLOYED_DEFAULTS,
    ...(employmentType !== 'EMPLOYED' ? BUSINESS_DEFAULTS : []),
  ];

  await prisma.category.createMany({
    data: defaults.map((cat) => ({ ...cat, userId })),
    skipDuplicates: true,
  });
}
