import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';
import Link from 'next/link';
import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link';

import { authOptions } from '@/lib/auth/auth';
import { getNoteById, noteDisplayTitle } from '@/lib/services/note.service';
import { tiptapJsonToMarkdown } from '@/lib/utils/tiptap-to-markdown';
import { NoteViewActions } from './_components/NoteViewActions';

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

  // Generate HTML server-side — same extensions as the editor and print page
  const html = generateHTML(note.body as Parameters<typeof generateHTML>[0], [
    StarterKit,
    LinkExtension,
  ]);

  // Pre-generate markdown on the server so NoteViewActions can download it
  // without loading the full Tiptap stack in the browser
  const markdownContent = tiptapJsonToMarkdown(note.body, note.title);

  return (
    <div className="mx-auto max-w-3xl">
      {/* Back to list */}
      <Link
        href="/notes"
        className="mb-6 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        ← Notes
      </Link>

      {/* Title */}
      <h1 className="mb-3 mt-4 text-3xl font-bold leading-tight text-zinc-900 dark:text-zinc-50">
        {title}
      </h1>

      {/* Metadata row */}
      <div className="mb-6 flex flex-wrap items-center gap-2 text-sm">
        {note.tags.length > 0 &&
          note.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700 dark:bg-teal-900/30 dark:text-teal-300"
            >
              #{tag}
            </span>
          ))}
        {note.task && (
          <Link
            href={`/tasks/${note.task.id}`}
            className="text-xs text-zinc-500 hover:underline dark:text-zinc-400"
          >
            ↗ {note.task.title}
          </Link>
        )}
        <span className="text-xs text-zinc-400 dark:text-zinc-500">
          Updated{' '}
          {new Date(note.updatedAt).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      </div>

      {/* Action bar */}
      <NoteViewActions
        noteId={note.id}
        noteTitle={title}
        markdownContent={markdownContent}
      />

      {/* Note body rendered with Tailwind Typography for comfortable reading.
          dangerouslySetInnerHTML: HTML is generated server-side from trusted Tiptap JSON
          stored in the DB. Only the authenticated note owner can access this page.
          generateHTML does not allow script injection from JSON. */}
      <div
        className="prose prose-zinc max-w-none dark:prose-invert prose-headings:font-semibold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-a:text-teal-600 prose-a:no-underline hover:prose-a:underline dark:prose-a:text-teal-400 prose-code:rounded prose-code:bg-zinc-100 prose-code:px-1 prose-code:py-0.5 prose-code:text-sm prose-code:before:content-none prose-code:after:content-none dark:prose-code:bg-zinc-800 prose-pre:rounded-lg prose-pre:bg-zinc-100 dark:prose-pre:bg-zinc-800 prose-blockquote:border-teal-300 prose-blockquote:not-italic dark:prose-blockquote:border-teal-700 prose-li:my-0.5 prose-p:leading-relaxed"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
