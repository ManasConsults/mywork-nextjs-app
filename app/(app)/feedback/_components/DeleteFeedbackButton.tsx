'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Loader2 } from 'lucide-react';

import { deleteMyFeedbackAction } from '@/lib/actions/feedback';

export function DeleteFeedbackButton({ id }: { id: string }): React.JSX.Element {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm('Delete this submission? This cannot be undone.')) return;
    setDeleting(true);
    try {
      const result = await deleteMyFeedbackAction(id);
      if (result.success) {
        router.refresh();
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      aria-label="Delete submission"
      className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-900/20 dark:hover:text-red-400"
    >
      {deleting
        ? <Loader2 size={14} className="animate-spin" aria-hidden="true" />
        : <Trash2 size={14} aria-hidden="true" />
      }
    </button>
  );
}
