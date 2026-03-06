import { Suspense } from 'react';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';

import { authOptions } from '@/lib/auth/auth';
import { getNotesByUser } from '@/lib/services/note.service';
import { getTasksByUser } from '@/lib/services/task.service';
import type { NoteFilters } from '@/lib/schemas/note.schema';
import { NoteList } from './_components/NoteList';
import { NoteFiltersBar } from './_components/NoteFiltersBar';

export const metadata: Metadata = { title: 'MyWork — Notes' };

interface NotesPageProps {
  searchParams: Promise<{ tag?: string; taskId?: string }>;
}

export default async function NotesPage({ searchParams }: NotesPageProps): Promise<React.JSX.Element> {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const { tag, taskId } = await searchParams;

  const filters: NoteFilters = {
    ...(tag ? { tag } : {}),
    ...(taskId ? { taskId } : {}),
  };

  const [notes, tasks] = await Promise.all([
    getNotesByUser(userId, filters),
    getTasksByUser(userId),
  ]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Notes</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {notes.length} {notes.length === 1 ? 'note' : 'notes'}
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
          currentTag={tag}
          currentTaskId={taskId}
        />
      </Suspense>

      <NoteList notes={notes} />
    </div>
  );
}
