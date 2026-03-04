'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { deleteTaskAction } from '@/lib/actions/task';

export function DeleteTaskButton({ taskId }: { taskId: string }): React.JSX.Element {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm('Delete this task? This cannot be undone.')) return;

    startTransition(async () => {
      await deleteTaskAction(taskId);
      router.push('/tasks');
    });
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
    >
      {isPending ? 'Deleting…' : 'Delete task'}
    </button>
  );
}
