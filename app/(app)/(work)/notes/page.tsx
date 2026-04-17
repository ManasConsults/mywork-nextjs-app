import { Suspense } from 'react';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';

import { authOptions } from '@/lib/auth/auth';
import { getTasksByUser } from '@/lib/services/task.service';
import { noteFiltersSchema } from '@/lib/schemas/note.schema';
import { NoteFiltersBar } from './_components/NoteFiltersBar';
import { NoteListServer } from './_components/NoteListServer';

export const metadata: Metadata = { title: 'MyWork — Notes' };

interface NotesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function NoteListSkeleton(): React.JSX.Element {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-lg border border-border bg-card p-4"
        >
          <div className="mb-2 h-4 w-1/2 rounded bg-muted" />
          <div className="space-y-1.5">
            <div className="h-3 w-full rounded bg-muted" />
            <div className="h-3 w-3/4 rounded bg-muted" />
          </div>
          <div className="mt-3 flex gap-2">
            <div className="h-4 w-14 rounded-full bg-muted" />
            <div className="h-4 w-20 rounded-full bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function NotesPage({ searchParams }: NotesPageProps): Promise<React.JSX.Element> {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const params = await searchParams;
  const filters = noteFiltersSchema.parse({
    tag: typeof params.tag === 'string' ? params.tag : undefined,
    taskId: typeof params.taskId === 'string' ? params.taskId : undefined,
    sortBy: typeof params.sortBy === 'string' ? params.sortBy : undefined,
    sortOrder: typeof params.sortOrder === 'string' ? params.sortOrder : undefined,
    page: typeof params.page === 'string' ? params.page : undefined,
    pageSize: typeof params.pageSize === 'string' ? params.pageSize : undefined,
  });

  // Fast indexed lookup — needed for the task dropdown in filters
  const tasks = await getTasksByUser(userId);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <Link
          href="/notes/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          + New note
        </Link>
      </div>

      <Suspense>
        <NoteFiltersBar
          tasks={tasks.map((t) => ({ id: t.id, title: t.title }))}
          currentTag={filters.tag}
          currentTaskId={filters.taskId}
          currentSortBy={filters.sortBy}
          currentSortOrder={filters.sortOrder}
          currentPageSize={filters.pageSize}
        />
      </Suspense>

      <Suspense fallback={<NoteListSkeleton />}>
        <NoteListServer userId={userId} filters={filters} />
      </Suspense>
    </div>
  );
}
