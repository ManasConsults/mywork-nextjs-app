'use client';

import { useRouter } from 'next/navigation';

interface NoteViewActionsProps {
  noteId: string;
  noteTitle: string;
  /** Pre-serialised markdown string generated server-side — avoids loading Tiptap on the view page */
  markdownContent: string;
}

export function NoteViewActions({
  noteId,
  noteTitle,
  markdownContent,
}: NoteViewActionsProps): React.JSX.Element {
  const router = useRouter();

  function handleDownloadMarkdown() {
    const blob = new Blob([markdownContent], { type: 'text/markdown; charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${noteTitle || 'note'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mb-8 flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={() => router.push(`/notes/${noteId}/edit`)}
        className="rounded-md bg-teal-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-teal-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        Edit
      </button>
      <button
        type="button"
        onClick={() => window.open(`/notes-print/${noteId}`, '_blank')}
        className="text-sm text-zinc-500 underline hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        Print PDF
      </button>
      <button
        type="button"
        onClick={handleDownloadMarkdown}
        className="text-sm text-zinc-500 underline hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        Download .md
      </button>
    </div>
  );
}
