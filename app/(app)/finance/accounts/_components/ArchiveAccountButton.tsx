'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { archiveAccountAction } from '@/lib/actions/finance/account';

interface ArchiveAccountButtonProps {
  accountId: string;
  accountName: string;
}

export function ArchiveAccountButton({
  accountId,
  accountName,
}: ArchiveAccountButtonProps): React.JSX.Element {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleArchive() {
    if (
      !window.confirm(
        `Archive "${accountName}"? This will hide the account from your finance views.`,
      )
    ) {
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await archiveAccountAction(accountId);
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div>
      {error && (
        <p className="mb-1 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
      <button
        type="button"
        onClick={handleArchive}
        disabled={isPending}
        className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-red-700 dark:hover:bg-red-900/20 dark:hover:text-red-400"
      >
        {isPending ? 'Archiving…' : 'Archive'}
      </button>
    </div>
  );
}
