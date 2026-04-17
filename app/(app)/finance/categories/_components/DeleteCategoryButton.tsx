'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { deleteCategoryAction } from '@/lib/actions/finance/category';
import { Button } from '@/components/ui/button';

interface DeleteCategoryButtonProps {
  id: string;
  name: string;
}

export function DeleteCategoryButton({ id, name }: DeleteCategoryButtonProps): React.JSX.Element {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete(): void {
    if (!window.confirm(`Delete category "${name}"? This cannot be undone.\n\nNote: categories with transactions or subcategories cannot be deleted.`)) {
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await deleteCategoryAction(id);
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      {error && <p className="max-w-[240px] text-right text-xs text-red-600 dark:text-red-400">{error}</p>}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleDelete}
        disabled={isPending}
        className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
      >
        {isPending ? 'Deleting…' : 'Delete'}
      </Button>
    </div>
  );
}
