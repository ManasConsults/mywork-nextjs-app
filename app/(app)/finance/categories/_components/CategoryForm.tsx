'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Category } from '@prisma/client';

import { createCategoryAction, updateCategoryAction } from '@/lib/actions/finance/category';
import { createCategorySchema, updateCategorySchema } from '@/lib/schemas/finance/category.schema';

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

function inputCls(hasError: boolean): string {
  return [
    'block w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500',
    'bg-white dark:bg-zinc-800 dark:text-zinc-50',
    hasError
      ? 'border-red-500 dark:border-red-500'
      : 'border-zinc-300 dark:border-zinc-700',
  ].join(' ');
}

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}

export function CategoryForm({
  category,
  employmentType,
}: CategoryFormProps): React.JSX.Element {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rootError, setRootError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

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
      type: fd.get('type') as string,
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
          if (result.error.fields) {
            setFieldErrors(result.error.fields as FieldErrors);
          }
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
          if (result.error.fields) {
            setFieldErrors(result.error.fields as FieldErrors);
          }
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
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
          {rootError}
        </div>
      )}

      <Field label="Name" error={fieldErrors.name?.[0]} required>
        <input
          name="name"
          type="text"
          defaultValue={category?.name ?? ''}
          placeholder="e.g. Groceries"
          required
          className={inputCls(!!fieldErrors.name)}
        />
      </Field>

      <Field label="Type" error={fieldErrors.type?.[0]} required>
        <select
          name="type"
          defaultValue={category?.type ?? 'PERSONAL'}
          className={inputCls(!!fieldErrors.type)}
        >
          {visibleTypes.map((t) => (
            <option key={t} value={t}>
              {CATEGORY_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Colour (optional)" error={fieldErrors.colour?.[0]}>
        <input
          name="colour"
          type="text"
          defaultValue={category?.colour ?? ''}
          placeholder="e.g. #3b82f6 or teal"
          maxLength={20}
          className={inputCls(!!fieldErrors.colour)}
        />
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Enter a hex colour code (e.g. #3b82f6) or a CSS colour name.
        </p>
      </Field>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 transition-colors disabled:opacity-50"
        >
          {isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Create category'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/finance/categories')}
          className="rounded-lg px-4 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
