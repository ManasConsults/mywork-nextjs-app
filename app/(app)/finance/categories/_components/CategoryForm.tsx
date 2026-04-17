'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Category } from '@prisma/client';

import { createCategoryAction, updateCategoryAction } from '@/lib/actions/finance/category';
import { createCategorySchema, updateCategorySchema } from '@/lib/schemas/finance/category.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type CategoryType = 'PERSONAL' | 'WORK_RELATED' | 'BUSINESS';

const CATEGORY_TYPE_LABELS: Record<CategoryType, string> = {
  PERSONAL: 'Personal',
  WORK_RELATED: 'Work-Related',
  BUSINESS: 'Business',
};

interface FieldErrors {
  name?: string[];
  type?: string[];
  colour?: string[];
}

interface CategoryFormProps {
  category?: Category;
  employmentType: string;
}

export function CategoryForm({
  category,
  employmentType,
}: CategoryFormProps): React.JSX.Element {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rootError, setRootError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [type, setType] = useState(category?.type ?? 'PERSONAL');

  const isEdit = !!category;
  const showBusiness = employmentType !== 'EMPLOYED';
  const visibleTypes: CategoryType[] = showBusiness
    ? ['PERSONAL', 'WORK_RELATED', 'BUSINESS']
    : ['PERSONAL', 'WORK_RELATED'];

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const raw = {
      name: (fd.get('name') as string).trim(),
      type,
      colour: (fd.get('colour') as string).trim() || undefined,
    };

    if (isEdit) {
      const parsed = updateCategorySchema.safeParse(raw);
      if (!parsed.success) {
        setFieldErrors(parsed.error.flatten().fieldErrors as FieldErrors);
        return;
      }
      setFieldErrors({});
      setRootError(null);

      startTransition(async () => {
        const result = await updateCategoryAction(category.id, parsed.data);
        if (!result.success) {
          setRootError(result.error.message);
          if (result.error.fields) setFieldErrors(result.error.fields as FieldErrors);
          return;
        }
        router.push('/finance/categories');
        router.refresh();
      });
    } else {
      const parsed = createCategorySchema.safeParse(raw);
      if (!parsed.success) {
        setFieldErrors(parsed.error.flatten().fieldErrors as FieldErrors);
        return;
      }
      setFieldErrors({});
      setRootError(null);

      startTransition(async () => {
        const result = await createCategoryAction(parsed.data);
        if (!result.success) {
          setRootError(result.error.message);
          if (result.error.fields) setFieldErrors(result.error.fields as FieldErrors);
          return;
        }
        router.push('/finance/categories');
        router.refresh();
      });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {rootError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {rootError}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="name">Name <span className="text-red-500">*</span></Label>
        <Input id="name" name="name" type="text" defaultValue={category?.name ?? ''} placeholder="e.g. Groceries" required disabled={isPending} aria-invalid={!!fieldErrors.name} />
        {fieldErrors.name?.[0] && <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.name[0]}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>Type <span className="text-red-500">*</span></Label>
        <Select value={type} onValueChange={(v) => setType(v as typeof type)} disabled={isPending}>
          <SelectTrigger aria-invalid={!!fieldErrors.type}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {visibleTypes.map((t) => (
              <SelectItem key={t} value={t}>{CATEGORY_TYPE_LABELS[t]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {fieldErrors.type?.[0] && <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.type[0]}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="colour">Colour (optional)</Label>
        <Input id="colour" name="colour" type="text" defaultValue={category?.colour ?? ''} placeholder="e.g. #3b82f6 or teal" maxLength={20} disabled={isPending} aria-invalid={!!fieldErrors.colour} />
        {fieldErrors.colour?.[0] && <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.colour[0]}</p>}
        <p className="text-xs text-muted-foreground">Enter a hex colour code (e.g. #3b82f6) or a CSS colour name.</p>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Create category'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push('/finance/categories')}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
