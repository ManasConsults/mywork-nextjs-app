import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';

import { authOptions } from '@/lib/auth/auth';
import { getNoteById, noteDisplayTitle } from '@/lib/services/note.service';
import { getTasksByUser } from '@/lib/services/task.service';
import { deleteNoteAction } from '@/lib/actions/note';
import { NoteEditor } from '../../_components/NoteEditor';
import { DeleteNoteButton } from '../../_components/DeleteNoteButton';

export const metadata: Metadata = { title: 'MyWork — Edit Note' };

interface NoteEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function NoteEditPage({
  params,
}: NoteEditPageProps): Promise<React.JSX.Element> {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const { id } = await params;

  const [note, tasks] = await Promise.all([getNoteById(userId, id), getTasksByUser(userId)]);

  if (!note) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <NoteEditor
        noteId={note.id}
        initialTitle={note.title ?? ''}
        initialBody={JSON.parse(JSON.stringify(note.body)) as Record<string, unknown>}
        initialTags={note.tags}
        initialTaskId={note.taskId ?? undefined}
        tasks={tasks.map((t) => ({ id: t.id, title: t.title }))}
        updatedAt={note.updatedAt.toISOString()}
      />
      <div className="mt-6 border-t border-border pt-6">
        <DeleteNoteButton id={note.id} title={noteDisplayTitle(note)} action={deleteNoteAction} />
      </div>
    </div>
  );
}
