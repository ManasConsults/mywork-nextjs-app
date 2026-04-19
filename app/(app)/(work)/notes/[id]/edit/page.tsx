import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';

import { authOptions } from '@/lib/auth/auth';
import { getNoteById, noteDisplayTitle } from '@/lib/services/note.service';
import { getTasksByUser, getTaskById } from '@/lib/services/task.service';
import { getWorkLogsByTask } from '@/lib/services/work-log.service';
import { deleteNoteAction } from '@/lib/actions/note';
import { NoteEditor } from '../../_components/NoteEditor';
import { DeleteNoteButton } from '../../_components/DeleteNoteButton';
import { NoteTaskPanel } from '../_components/NoteTaskPanel';

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

  const [task, workLogs] = await Promise.all([
    note.taskId ? getTaskById(userId, note.taskId) : Promise.resolve(null),
    note.taskId ? getWorkLogsByTask(userId, note.taskId) : Promise.resolve([]),
  ]);

  return (
    <div className="mx-auto max-w-6xl">
      <style>{`
        #note-edit-grid {
          display: grid;
          grid-template-columns: 1fr 17rem;
          gap: 2rem;
          align-items: start;
        }
        @media (max-width: 1023px) {
          #note-edit-grid { grid-template-columns: 1fr; }
        }
      `}</style>
      <Link
        href="/notes"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        ← Notes
      </Link>

      <div id="note-edit-grid">
        {/* ── Left: editor ── */}
        <div className="min-w-0">
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

        {/* ── Right: task + work log panel ── */}
        {task ? (
          <NoteTaskPanel task={task} workLogs={workLogs} />
        ) : (
          <aside className="hidden xl:block">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Linked Task
              </p>
              <p className="mt-2 text-xs text-muted-foreground">No task linked to this note.</p>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
