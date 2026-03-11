'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteBudgetAction } from '@/lib/actions/finance/budget';

interface DeleteBudgetButtonProps {
  id: string;
  categoryName: string;
}

export function DeleteBudgetButton({
  id,
  categoryName,
}: DeleteBudgetButtonProps): React.JSX.Element {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete(): void {
    if (
      !confirm(
        `Delete the budget for "${categoryName}"? This cannot be undone.`,
      )
    ) {
      return;
    }

    startTransition(async () => {
      await deleteBudgetAction(id);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className="rounded px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-900/20"
      aria-label={`Delete budget for ${categoryName}`}
    >
      {isPending ? 'Deleting…' : 'Delete'}
    </button>
  );
}
