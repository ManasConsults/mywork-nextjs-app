import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';

import { authOptions } from '@/lib/auth/auth';
import { getTasksByUser } from '@/lib/services/task.service';
import { todoFiltersSchema } from '@/lib/schemas/todo.schema';
import { AddTodoForm } from './_components/AddTodoForm';
import { TodoFiltersBar } from './_components/TodoFiltersBar';
import { TodoListServer } from './_components/TodoListServer';

export const metadata: Metadata = { title: 'MyWork — To-do' };

interface TodoPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function TodoListSkeleton(): React.JSX.Element {
  return (
    <div className="divide-y divide-border/60 rounded-lg border border-border bg-card">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex animate-pulse items-center gap-3 px-4 py-3">
          <div className="h-5 w-5 shrink-0 rounded-full bg-muted" />
          <div className="flex-1 space-y-1.5">
            <div className="h-4 w-2/3 rounded bg-muted" />
            <div className="h-3 w-1/4 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function TodoPage({ searchParams }: TodoPageProps): Promise<React.JSX.Element> {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const params = await searchParams;
  const filters = todoFiltersSchema.parse({
    status: typeof params.status === 'string' ? params.status : undefined,
    sortBy: typeof params.sortBy === 'string' ? params.sortBy : undefined,
    sortOrder: typeof params.sortOrder === 'string' ? params.sortOrder : undefined,
    page: typeof params.page === 'string' ? params.page : undefined,
    pageSize: typeof params.pageSize === 'string' ? params.pageSize : undefined,
  });

  // Fast indexed lookup — needed for AddTodoForm and inline edit dropdowns
  const tasks = await getTasksByUser(userId);
  const taskOptions = tasks.map((t) => ({ id: t.id, title: t.title }));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        {/* Legend */}
        <div className="hidden items-center gap-3 sm:flex">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#0d9488', flexShrink: 0 }} />Upcoming
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#eab308', flexShrink: 0 }} />Due today
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444', flexShrink: 0 }} />Overdue
          </span>
        </div>
      </div>

      {/* Add form */}
      <div className="rounded-xl border border-border bg-card p-4">
        <AddTodoForm tasks={taskOptions} />
      </div>

      {/* Filters + sort */}
      <Suspense>
        <TodoFiltersBar
          currentStatus={filters.status}
          currentSortBy={filters.sortBy}
          currentSortOrder={filters.sortOrder}
          currentPageSize={filters.pageSize}
        />
      </Suspense>

      {/* List streams in */}
      <Suspense fallback={<TodoListSkeleton />}>
        <TodoListServer userId={userId} filters={filters} taskOptions={taskOptions} />
      </Suspense>
    </div>
  );
}
