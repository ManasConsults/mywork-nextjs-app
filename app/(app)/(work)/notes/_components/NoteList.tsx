'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import type { Note } from '@prisma/client';

import { deleteNoteAction } from '@/lib/actions/note';
import { noteDisplayTitle, noteBodyPreview } from '@/lib/utils/note-helpers';

type NoteWithTask = Note & { task: { id: string; title: string } | null };

function formatRelativeDate(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function NoteList({ notes }: { notes: NoteWithTask[] }): React.JSX.Element {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    startTransition(async () => {
      await deleteNoteAction(id);
      router.refresh();
    });
  }

  if (notes.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-200 py-12 text-center dark:border-zinc-700">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No notes found.</p>
        <Link
          href="/notes/new"
          className="mt-3 inline-block text-sm font-medium text-teal-600 underline dark:text-teal-400"
        >
          Create your first note
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {notes.map((note) => {
        const title = noteDisplayTitle(note);
        const preview = noteBodyPreview(note);

        return (
          <li
            key={note.id}
            className="rounded-lg border border-zinc-200 bg-white p-4 transition-shadow hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <Link
                  href={`/notes/${note.id}`}
                  className="block font-medium text-zinc-900 hover:text-teal-600 dark:text-zinc-50 dark:hover:text-teal-400"
                >
                  {title}
                </Link>
                {preview && (
                  <p className="mt-1 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
                    {preview}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {note.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700 dark:bg-teal-900/30 dark:text-teal-300"
                    >
                      {tag}
                    </span>
                  ))}
                  {note.task && (
                    <Link
                      href={`/tasks/${note.task.id}`}
                      className="text-xs text-zinc-400 hover:text-zinc-600 hover:underline dark:text-zinc-500 dark:hover:text-zinc-300"
                    >
                      ↗ {note.task.title}
                    </Link>
                  )}
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">
                    {formatRelativeDate(new Date(note.updatedAt))}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Link
                  href={`/notes/${note.id}/edit`}
                  className="text-xs text-zinc-500 underline hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(note.id, title)}
                  disabled={isPending}
                  className="text-xs text-red-500 underline hover:text-red-700 disabled:opacity-50 dark:text-red-400"
                >
                  Delete
                </button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
