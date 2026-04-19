'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import type { Note } from '@prisma/client';

import { deleteNoteAction } from '@/lib/actions/note';
import { noteDisplayTitle, noteBodyPreview } from '@/lib/utils/note-helpers';
import { Button } from '@/components/ui/button';

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
      <div className="rounded-lg border border-dashed border-border py-12 text-center">
        <p className="text-sm text-muted-foreground">No notes found.</p>
        <Link
          href="/notes/new"
          className="mt-3 inline-block text-sm font-medium text-primary underline"
        >
          Create your first note
        </Link>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {notes.map((note) => {
        const title = noteDisplayTitle(note);
        const preview = noteBodyPreview(note);

        return (
          <li
            key={note.id}
            className="rounded-lg border border-border bg-card p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <Link
                  href={`/notes/${note.id}`}
                  className="block font-medium text-foreground hover:text-primary"
                >
                  {title}
                </Link>
                {preview && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {preview}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {note.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-primary/5 px-2 py-0.5 text-xs font-medium text-primary"
                    >
                      {tag}
                    </span>
                  ))}
                  {note.task && (
                    <Link
                      href={`/tasks/${note.task.id}`}
                      className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                    >
                      ↗ {note.task.title}
                    </Link>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeDate(new Date(note.updatedAt))}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Link
                  href={`/notes/${note.id}/edit`}
                  className="text-xs text-muted-foreground underline hover:text-foreground"
                >
                  Edit
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(note.id, title)}
                  disabled={isPending}
                  className="h-auto p-0 text-xs text-red-500 underline hover:text-red-700 hover:bg-transparent dark:text-red-400"
                >
                  Delete
                </Button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
