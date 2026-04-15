'use client';

import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';

interface NoteViewActionsProps {
  noteId: string;
  noteTitle: string;
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
      <Button onClick={() => router.push(`/notes/${noteId}/edit`)}>Edit</Button>
      <Button variant="ghost" onClick={() => window.open(`/notes-print/${noteId}`, '_blank')} className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200">
        Print PDF
      </Button>
      <Button variant="ghost" onClick={handleDownloadMarkdown} className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200">
        Download .md
      </Button>
    </div>
  );
}
