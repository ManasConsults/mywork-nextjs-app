import type { TodoItem, Prisma } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';
import type { CreateTodoInput, UpdateTodoInput, TodoFilters } from '@/lib/schemas/todo.schema';

export type TodoItemWithTask = TodoItem & { task: { id: string; title: string } | null };

export interface PagedTodos {
  todos: TodoItemWithTask[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const taskSelect = { select: { id: true, title: true } };

export async function getTodosByUser(userId: string): Promise<TodoItemWithTask[]> {
  return prisma.todoItem.findMany({
    where: { userId },
    include: { task: taskSelect },
    orderBy: [
      { isDone: 'asc' },
      { dueDate: { sort: 'asc', nulls: 'last' } },
      { createdAt: 'asc' },
    ],
  });
}

export async function getTodosByUserPaged(
  userId: string,
  filters: TodoFilters,
): Promise<PagedTodos> {
  const { status, sortBy, sortOrder, page, pageSize } = filters;

  const where: Prisma.TodoItemWhereInput = {
    userId,
    ...(status !== 'all' ? { isDone: status === 'complete' } : {}),
  };

  const orderBy: Prisma.TodoItemOrderByWithRelationInput[] =
    sortBy === 'status'
      ? [{ isDone: sortOrder }, { createdAt: 'desc' as const }]
      : sortBy === 'dueDate'
        ? [{ dueDate: { sort: sortOrder, nulls: 'last' } }, { createdAt: 'desc' as const }]
        : [{ createdAt: sortOrder }];

  const [todos, total] = await Promise.all([
    prisma.todoItem.findMany({
      where,
      include: { task: taskSelect },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.todoItem.count({ where }),
  ]);

  return {
    todos,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function createTodo(userId: string, data: CreateTodoInput): Promise<TodoItemWithTask> {
  return prisma.todoItem.create({
    data: {
      title: data.title,
      dueDate: data.dueDate ?? null,
      taskId: data.taskId ?? null,
      userId,
    },
    include: { task: taskSelect },
  });
}

/** Eliminates the N+1 pre-flight SELECT by folding auth into the WHERE clause. */
export async function updateTodo(
  userId: string,
  id: string,
  data: UpdateTodoInput,
): Promise<TodoItemWithTask | null> {
  const result = await prisma.todoItem.updateMany({ where: { id, userId }, data });
  if (result.count === 0) return null;
  return prisma.todoItem.findFirst({ where: { id, userId }, include: { task: taskSelect } });
}

/** Eliminates the N+1 pre-flight SELECT by folding auth into the WHERE clause. */
export async function deleteTodo(userId: string, id: string): Promise<boolean> {
  const result = await prisma.todoItem.deleteMany({ where: { id, userId } });
  return result.count > 0;
}
