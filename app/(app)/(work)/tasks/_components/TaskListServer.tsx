import { Suspense } from 'react';

import { getTasksByUserPaged } from '@/lib/services/task.service';
import type { TaskFilters } from '@/lib/schemas/task.schema';
import { TaskList } from './TaskList';
import { TaskPagination } from './TaskPagination';

interface Props {
  userId: string;
  filters: TaskFilters;
}

export async function TaskListServer({ userId, filters }: Props): Promise<React.JSX.Element> {
  const { tasks, total, page, pageSize, totalPages } = await getTasksByUserPaged(userId, filters);

  return (
    <>
      <TaskList tasks={tasks} />
      <Suspense>
        <TaskPagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} />
      </Suspense>
    </>
  );
}
