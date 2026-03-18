import { Suspense } from 'react';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';

import { authOptions } from '@/lib/auth/auth';
import { getNotesByUserPaged } from '@/lib/services/note.service';
import { getTasksByUser } from '@/lib/services/task.service';
import { noteFiltersSchema } from '@/lib/schemas/note.schema';
import { NoteList } from './_components/NoteList';
import { NoteFiltersBar } from './_components/NoteFiltersBar';
import { NotePagination } from './_components/NotePagination';

export const metadata: Metadata = { title: 'MyWork — Notes' };

interface NotesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
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

  const [{ notes, total, page, pageSize, totalPages }, tasks] = await Promise.all([
    getNotesByUserPaged(userId, filters),
    getTasksByUser(userId),
  ]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Notes</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {total} {total === 1 ? 'note' : 'notes'}
          </p>
        </div>
        <Link
          href="/notes/new"
          className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
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

      <NoteList notes={notes} />

      <Suspense>
        <NotePagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} />
      </Suspense>
    </div>
  );
}
