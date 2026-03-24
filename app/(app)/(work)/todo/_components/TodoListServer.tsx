import { Suspense } from 'react';

import { getTodosByUserPaged } from '@/lib/services/todo.service';
import type { TodoFilters } from '@/lib/schemas/todo.schema';
import { TodoList } from './TodoList';
import { TodoPagination } from './TodoPagination';

interface Props {
  userId: string;
  filters: TodoFilters;
  taskOptions: { id: string; title: string }[];
}

export async function TodoListServer({ userId, filters, taskOptions }: Props): Promise<React.JSX.Element> {
  const { todos, total, page, pageSize, totalPages } = await getTodosByUserPaged(userId, filters);

  return (
    <>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        {total} {total === 1 ? 'item' : 'items'}
      </p>
      <TodoList todos={todos} tasks={taskOptions} />
      <Suspense>
        <TodoPagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} />
      </Suspense>
    </>
  );
}
