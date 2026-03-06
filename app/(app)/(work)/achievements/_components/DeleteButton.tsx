'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';

interface DeleteButtonProps {
  id: string;
  title: string;
  action: (id: string) => Promise<{ success: boolean; error?: { message: string } }>;
}

export function DeleteButton({ id, title, action }: DeleteButtonProps): React.JSX.Element {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    startTransition(async () => {
      await action(id);
      router.push('/achievements');
    });
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="rounded-md px-3 py-1.5 text-sm text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-900/20"
    >
      {isPending ? 'Deleting…' : 'Delete achievement'}
    </button>
  );
}
