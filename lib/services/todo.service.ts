import type { TodoItem } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';
import type { CreateTodoInput, UpdateTodoInput } from '@/lib/schemas/todo.schema';

export type TodoItemWithTask = TodoItem & { task: { id: string; title: string } | null };

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

export async function updateTodo(
  userId: string,
  id: string,
  data: UpdateTodoInput,
): Promise<TodoItemWithTask | null> {
  const existing = await prisma.todoItem.findFirst({ where: { id, userId } });
  if (!existing) return null;

  return prisma.todoItem.update({
    where: { id },
    data,
    include: { task: taskSelect },
  });
}

export async function deleteTodo(userId: string, id: string): Promise<boolean> {
  const existing = await prisma.todoItem.findFirst({ where: { id, userId } });
  if (!existing) return false;

  await prisma.todoItem.delete({ where: { id } });
  return true;
}
