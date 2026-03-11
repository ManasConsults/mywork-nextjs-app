'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteInvoiceAction } from '@/lib/actions/finance/invoice';

interface DeleteInvoiceButtonProps {
  id: string;
  /** When true, redirect to /finance/invoices after deletion. */
  redirectAfterDelete?: boolean;
}

export function DeleteInvoiceButton({
  id,
  redirectAfterDelete = false,
}: DeleteInvoiceButtonProps): React.JSX.Element {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleDelete(): void {
    startTransition(async () => {
      const result = await deleteInvoiceAction(id);
      if (result.success) {
        if (redirectAfterDelete) {
          router.push('/finance/invoices');
        }
      } else {
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
          {isPending ? 'Deleting…' : 'Confirm delete'}
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
      className="rounded-lg border border-red-200 px-3 py-1 text-xs text-red-600 transition-colors hover:bg-red-50 dark:border-red-800/60 dark:text-red-400 dark:hover:bg-red-900/20"
    >
      Delete
    </button>
  );
}
