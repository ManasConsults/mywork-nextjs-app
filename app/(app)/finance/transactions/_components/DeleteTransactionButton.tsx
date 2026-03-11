'use client';

import { useState, useTransition } from 'react';
import { deleteTransactionAction } from '@/lib/actions/finance/transaction';

interface DeleteTransactionButtonProps {
  id: string;
}

export function DeleteTransactionButton({ id }: DeleteTransactionButtonProps): React.JSX.Element {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete(): void {
    startTransition(async () => {
      const result = await deleteTransactionAction(id);
      if (!result.success) {
        setError(result.error.message);
        setConfirming(false);
      }
    });
  }

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-2">
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="rounded px-2 py-0.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Deleting…' : 'Confirm'}
        </button>
        <button
          onClick={() => { setConfirming(false); setError(null); }}
          disabled={isPending}
          className="rounded px-2 py-0.5 text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 disabled:opacity-50"
        >
          Cancel
        </button>
        {error && <span className="text-xs text-red-500">{error}</span>}
      </span>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-xs font-medium"
    >
      Delete
    </button>
  );
}
