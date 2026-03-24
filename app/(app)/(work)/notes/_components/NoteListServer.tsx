import { Suspense } from 'react';

import { getNotesByUserPaged } from '@/lib/services/note.service';
import type { NoteFilters } from '@/lib/schemas/note.schema';
import { NoteList } from './NoteList';
import { NotePagination } from './NotePagination';

interface Props {
  userId: string;
  filters: NoteFilters;
}

export async function NoteListServer({ userId, filters }: Props): Promise<React.JSX.Element> {
  const { notes, total, page, pageSize, totalPages } = await getNotesByUserPaged(userId, filters);

  return (
    <>
      <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
        {total} {total === 1 ? 'note' : 'notes'}
      </p>
      <NoteList notes={notes} />
      <Suspense>
        <NotePagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} />
      </Suspense>
    </>
  );
}
