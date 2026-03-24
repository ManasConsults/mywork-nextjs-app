import type { Task } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';
import type { CreateTaskInput, UpdateTaskInput, TaskFilters } from '@/lib/schemas/task.schema';
import { taskFiltersSchema } from '@/lib/schemas/task.schema';

/** Narrow type used for list views — excludes heavy fields (description, tags). */
export type TaskListItem = Pick<Task, 'id' | 'title' | 'status' | 'priority' | 'dueDate'>;

export interface PagedTasks {
  tasks: TaskListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Full rows — used by the Kanban board where all fields are needed. */
export async function getTasksByUser(
  userId: string,
  filters: TaskFilters = taskFiltersSchema.parse({}),
): Promise<Task[]> {
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

/** Paged list — projects only the five fields rendered by TaskList. */
export async function getTasksByUserPaged(
  userId: string,
  filters: TaskFilters,
): Promise<PagedTasks> {
  const { status, priority, sortBy, sortOrder, page, pageSize } = filters;

  const where = {
    userId,
    deletedAt: null,
    ...(status ? { status } : {}),
    ...(priority ? { priority } : {}),
  };

  const orderBy =
    sortBy === 'dueDate'
      ? [{ dueDate: sortOrder }, { createdAt: 'desc' as const }]
      : sortBy === 'status'
        ? [{ status: sortOrder }, { createdAt: 'desc' as const }]
        : [{ createdAt: sortOrder }];

  // Run count and data queries in parallel — no transaction needed for reads.
  // Select only the five fields TaskList renders; avoids fetching description/tags.
  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        dueDate: true,
      },
    }),
    prisma.task.count({ where }),
  ]);

  return {
    tasks,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getTaskById(userId: string, taskId: string): Promise<Task | null> {
  return prisma.task.findFirst({
    where: { id: taskId, userId, deletedAt: null },
  });
}

export async function createTask(userId: string, data: CreateTaskInput): Promise<Task> {
  return prisma.task.create({ data: { ...data, userId } });
}

/** Eliminates the N+1 pre-flight SELECT by folding auth into the WHERE clause. */
export async function updateTask(
  userId: string,
  taskId: string,
  data: UpdateTaskInput,
): Promise<Task | null> {
  const result = await prisma.task.updateMany({
    where: { id: taskId, userId, deletedAt: null },
    data,
  });
  if (result.count === 0) return null;
  return prisma.task.findFirst({ where: { id: taskId, userId } });
}

/** Eliminates the N+1 pre-flight SELECT by folding auth into the WHERE clause. */
export async function softDeleteTask(userId: string, taskId: string): Promise<boolean> {
  const result = await prisma.task.updateMany({
    where: { id: taskId, userId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return result.count > 0;
}
