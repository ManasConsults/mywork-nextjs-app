'use client';

import { useState, useTransition } from 'react';

import { deleteTransactionAction } from '@/lib/actions/finance/transaction';
import { Button } from '@/components/ui/button';

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
        <Button size="sm" variant="destructive" onClick={handleDelete} disabled={isPending}>
          {isPending ? 'Deleting…' : 'Confirm'}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => { setConfirming(false); setError(null); }} disabled={isPending}>
          Cancel
        </Button>
        {error && <span className="text-xs text-red-500">{error}</span>}
      </span>
    );
  }

  return (
    <Button variant="ghost" size="sm" onClick={() => setConfirming(true)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
      Delete
    </Button>
  );
}
