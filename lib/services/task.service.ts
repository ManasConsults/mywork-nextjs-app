import type { Task } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';
import type { CreateTaskInput, UpdateTaskInput, TaskFilters } from '@/lib/schemas/task.schema';

export async function getTasksByUser(userId: string, filters: TaskFilters = {}): Promise<Task[]> {
  return prisma.task.findMany({
    where: {
      userId,
      deletedAt: null,
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.priority ? { priority: filters.priority } : {}),
    },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function getTaskById(userId: string, taskId: string): Promise<Task | null> {
  return prisma.task.findFirst({
    where: { id: taskId, userId, deletedAt: null },
  });
}

export async function createTask(userId: string, data: CreateTaskInput): Promise<Task> {
  return prisma.task.create({
    data: {
      ...data,
      userId,
    },
  });
}

export async function updateTask(
  userId: string,
  taskId: string,
  data: UpdateTaskInput,
): Promise<Task | null> {
  const existing = await getTaskById(userId, taskId);
  if (!existing) return null;

  return prisma.task.update({
    where: { id: taskId },
    data,
  });
}

export async function softDeleteTask(userId: string, taskId: string): Promise<boolean> {
  const existing = await getTaskById(userId, taskId);
  if (!existing) return false;

  await prisma.task.update({
    where: { id: taskId },
    data: { deletedAt: new Date() },
  });
  return true;
}
