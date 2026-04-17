'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { deleteTaskAction } from '@/lib/actions/task';
import { Button } from '@/components/ui/button';

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
    <Button
      variant="outline"
      size="sm"
      onClick={handleDelete}
      disabled={isPending}
      className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
    >
      {isPending ? 'Deleting…' : 'Delete task'}
    </Button>
  );
}
