'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { deleteInvoiceAction } from '@/lib/actions/finance/invoice';
import { Button } from '@/components/ui/button';

interface DeleteInvoiceButtonProps {
  id: string;
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
        <Button size="sm" variant="destructive" onClick={handleDelete} disabled={isPending}>
          {isPending ? 'Deleting…' : 'Confirm delete'}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => { setConfirming(false); setError(null); }} disabled={isPending}>
          Cancel
        </Button>
        {error && <span className="text-xs text-red-500">{error}</span>}
      </span>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setConfirming(true)}
      className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800/60 dark:text-red-400 dark:hover:bg-red-900/20"
    >
      Delete
    </Button>
  );
}
