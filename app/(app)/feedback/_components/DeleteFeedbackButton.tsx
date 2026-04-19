'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Loader2 } from 'lucide-react';

import { deleteMyFeedbackAction } from '@/lib/actions/feedback';
import { Button } from '@/components/ui/button';

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
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={handleDelete}
      disabled={deleting}
      aria-label="Delete submission"
      className="size-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
    >
      {deleting
        ? <Loader2 size={14} className="animate-spin" aria-hidden="true" />
        : <Trash2 size={14} aria-hidden="true" />
      }
    </Button>
  );
}
