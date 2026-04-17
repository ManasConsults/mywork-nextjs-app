'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';

interface DeleteNoteButtonProps {
  id: string;
  title: string;
  action: (id: string) => Promise<{ success: boolean; error?: { message: string } }>;
}

export function DeleteNoteButton({ id, title, action }: DeleteNoteButtonProps): React.JSX.Element {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    startTransition(async () => {
      await action(id);
      router.push('/notes');
    });
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDelete}
      disabled={isPending}
      className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
    >
      {isPending ? 'Deleting…' : 'Delete note'}
    </Button>
  );
}
