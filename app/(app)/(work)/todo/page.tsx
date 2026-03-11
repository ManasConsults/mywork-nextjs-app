import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';

import { authOptions } from '@/lib/auth/auth';
import { getTodosByUser } from '@/lib/services/todo.service';
import { getTasksByUser } from '@/lib/services/task.service';
import { AddTodoForm } from './_components/AddTodoForm';
import { TodoList } from './_components/TodoList';

export const metadata: Metadata = { title: 'MyWork — To-do' };

export default async function TodoPage(): Promise<React.JSX.Element> {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const [todos, tasks] = await Promise.all([
    getTodosByUser(userId),
    getTasksByUser(userId),
  ]);

  const total = todos.length;
  const done = todos.filter((t) => t.isDone).length;
  const taskOptions = tasks.map((t) => ({ id: t.id, title: t.title }));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">To-do</h1>
          {total > 0 && (
            <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
              {done} of {total} done
            </p>
          )}
        </div>
        {/* Legend */}
        <div className="hidden items-center gap-3 sm:flex">
          <span className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#0d9488', flexShrink: 0 }} />Upcoming
          </span>
          <span className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#eab308', flexShrink: 0 }} />Due today
          </span>
          <span className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444', flexShrink: 0 }} />Overdue
          </span>
        </div>
      </div>

      {/* Add form */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <AddTodoForm tasks={taskOptions} />
      </div>

      {/* List */}
      <TodoList todos={todos} tasks={taskOptions} />
    </div>
  );
}
