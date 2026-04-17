'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { archiveClientAction } from '@/lib/actions/finance/client';
import { Button } from '@/components/ui/button';

interface ArchiveClientButtonProps {
  clientId: string;
  clientName: string;
}

export function ArchiveClientButton({
  clientId,
  clientName,
}: ArchiveClientButtonProps): React.JSX.Element {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleArchive() {
    if (!window.confirm(`Archive "${clientName}"? This will hide the client from your active client list.`)) {
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await archiveClientAction(clientId);
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div>
      {error && <p className="mb-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
      <Button type="button" variant="outline" size="sm" onClick={handleArchive} disabled={isPending} className="hover:border-red-300 hover:bg-red-50 hover:text-red-700 dark:hover:border-red-700 dark:hover:bg-red-900/20 dark:hover:text-red-400">
        {isPending ? 'Archiving…' : 'Archive'}
      </Button>
    </div>
  );
}
