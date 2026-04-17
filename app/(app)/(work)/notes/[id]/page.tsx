import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';
import Link from 'next/link';
import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table';

import { authOptions } from '@/lib/auth/auth';
import { getNoteById, noteDisplayTitle } from '@/lib/services/note.service';
import { getTaskById } from '@/lib/services/task.service';
import { getWorkLogsByTask } from '@/lib/services/work-log.service';
import { tiptapJsonToMarkdown } from '@/lib/utils/tiptap-to-markdown';
import { NoteViewActions } from './_components/NoteViewActions';
import { NoteTaskPanel } from './_components/NoteTaskPanel';

interface NoteViewPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: NoteViewPageProps): Promise<Metadata> {
  const session = await getServerSession(authOptions);
  if (!session) return { title: 'MyWork — Note' };
  const { id } = await params;
  const note = await getNoteById(session.user.id, id);
  const title = note ? noteDisplayTitle(note) : 'Note';
  return { title: `MyWork — ${title}` };
}

export default async function NoteViewPage({
  params,
}: NoteViewPageProps): Promise<React.JSX.Element> {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const { id } = await params;
  const note = await getNoteById(userId, id);
  if (!note) notFound();

  const title = noteDisplayTitle(note);

  // Fetch task + work logs in parallel when note is task-linked
  const [task, workLogs] = await Promise.all([
    note.taskId ? getTaskById(userId, note.taskId) : Promise.resolve(null),
    note.taskId ? getWorkLogsByTask(userId, note.taskId) : Promise.resolve([]),
  ]);

  const html = generateHTML(note.body as Parameters<typeof generateHTML>[0], [
    StarterKit,
    Table,
    TableRow,
    TableCell,
    TableHeader,
  ]);

  const markdownContent = tiptapJsonToMarkdown(note.body, note.title);

  return (
    <div className="mx-auto max-w-6xl">
      <style>{`
        #note-view-grid {
          display: grid;
          grid-template-columns: 1fr 17rem;
          gap: 2rem;
          align-items: start;
        }
        @media (max-width: 1023px) {
          #note-view-grid { grid-template-columns: 1fr; }
        }
      `}</style>
      {/* Top bar */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/notes"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          ← Notes
        </Link>
        <Link
          href="/notes/new"
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          + New note
        </Link>
      </div>

      <div id="note-view-grid">
        {/* ── Left: note content ── */}
        <div className="min-w-0">
          <h1 className="mb-3 text-3xl font-bold leading-tight text-foreground">
            {title}
          </h1>

          {/* Metadata row */}
          <div className="mb-6 flex flex-wrap items-center gap-2 text-sm">
            {note.tags.length > 0 &&
              note.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-primary/5 px-2 py-0.5 text-xs font-medium text-primary"
                >
                  #{tag}
                </span>
              ))}
            {note.task && (
              <Link
                href={`/tasks/${note.task.id}`}
                className="text-xs text-muted-foreground hover:underline"
              >
                ↗ {note.task.title}
              </Link>
            )}
            <span className="text-xs text-muted-foreground">
              Updated{' '}
              {new Date(note.updatedAt).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>

          <NoteViewActions
            noteId={note.id}
            noteTitle={title}
            markdownContent={markdownContent}
          />

          {/* Note body — inline <style> bypasses @tailwindcss/typography cascade.
              Typography targets thead/tbody but Tiptap puts <th> in <tbody> directly. */}
          <style>{`
            .note-body table {
              border-collapse: collapse;
              width: 100%;
              font-size: 0.875rem;
              margin: 1rem 0;
              table-layout: fixed;
            }
            .note-body th,
            .note-body td {
              border: 1px solid var(--border);
              padding: 0.375rem 0.625rem;
              vertical-align: top;
              text-align: left;
              min-width: 6rem;
              word-break: break-word;
            }
            .note-body th {
              background-color: var(--muted);
              color: var(--foreground);
              font-weight: 600;
            }
            .note-body th p,
            .note-body td p {
              margin: 0;
            }
            .note-body tr:hover td {
              background-color: var(--accent);
            }
          `}</style>
          <div
            className="note-body prose prose-zinc max-w-none dark:prose-invert prose-headings:font-semibold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-code:rounded prose-code:bg-zinc-100 prose-code:px-1 prose-code:py-0.5 prose-code:text-sm prose-code:before:content-none prose-code:after:content-none dark:prose-code:bg-zinc-800 prose-pre:rounded-lg prose-pre:bg-zinc-100 dark:prose-pre:bg-zinc-800 prose-blockquote:border-primary/40 prose-blockquote:not-italic prose-li:my-0.5 prose-p:leading-relaxed"
            dangerouslySetInnerHTML={{ __html: html }}
          />
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
