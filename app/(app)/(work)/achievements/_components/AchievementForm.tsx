'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Achievement, Task } from '@prisma/client';

import {
  ACHIEVEMENT_CATEGORIES,
  createAchievementSchema,
  updateAchievementSchema,
} from '@/lib/schemas/achievement.schema';
import { createAchievementAction, updateAchievementAction } from '@/lib/actions/achievement';

interface FieldErrors {
  title?: string[];
  description?: string[];
  category?: string[];
  dateAchieved?: string[];
  impactRating?: string[];
  taskId?: string[];
}

interface AchievementFormProps {
  achievement?: Achievement;
  tasks: Task[];
}

const CATEGORY_LABELS: Record<string, string> = {
  Leadership: 'Leadership',
  Delivery: 'Delivery',
  Innovation: 'Innovation',
  Collaboration: 'Collaboration',
  Learning: 'Learning',
};

function inputCls(hasError: boolean) {
  return `w-full rounded-md border px-3 py-2 text-sm outline-none transition-colors focus:ring-2 focus:ring-teal-500/30 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:ring-zinc-50/20 ${
    hasError ? 'border-red-500 dark:border-red-500' : 'border-zinc-200 dark:border-zinc-700'
  }`;
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

function StarRating({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
}): React.JSX.Element {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(value === star ? null : star)}
          className="text-2xl leading-none transition-colors focus:outline-none"
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
        >
          <span className={star <= (value ?? 0) ? 'text-amber-400' : 'text-zinc-300 dark:text-zinc-600'}>
            ★
          </span>
        </button>
      ))}
      {value != null && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="ml-1 text-xs text-zinc-400 underline hover:text-zinc-600"
        >
          Clear
        </button>
      )}
    </div>
  );
}

export function AchievementForm({ achievement, tasks }: AchievementFormProps): React.JSX.Element {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rootError, setRootError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [impactRating, setImpactRating] = useState<number | null>(achievement?.impactRating ?? null);

  const isEdit = !!achievement;
  const defaultDate = achievement?.dateAchieved
    ? new Date(achievement.dateAchieved).toISOString().split('T')[0]
    : '';

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const raw = {
      title: fd.get('title') as string,
      description: fd.get('description') as string,
      category: (fd.get('category') as string) || undefined,
      dateAchieved: (fd.get('dateAchieved') as string) || undefined,
      impactRating: impactRating ?? undefined,
      taskId: (fd.get('taskId') as string) || undefined,
    };

    const schema = isEdit ? updateAchievementSchema : createAchievementSchema;
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      setFieldErrors(parsed.error.flatten().fieldErrors as FieldErrors);
      return;
    }
    setFieldErrors({});
    setRootError(null);

    startTransition(async () => {
      const result = isEdit
        ? await updateAchievementAction(achievement.id, parsed.data)
        : await createAchievementAction(parsed.data as Parameters<typeof createAchievementAction>[0]);

      if (!result.success) {
        setRootError(result.error.message);
        if (result.error.fields) setFieldErrors(result.error.fields as FieldErrors);
        return;
      }
      router.push('/achievements');
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {rootError && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {rootError}
        </p>
      )}

      <Field label="Title" error={fieldErrors.title?.[0]}>
        <input
          name="title"
          defaultValue={achievement?.title ?? ''}
          placeholder="What did you achieve?"
          className={inputCls(!!fieldErrors.title)}
        />
      </Field>

      <Field label="Description" error={fieldErrors.description?.[0]}>
        <textarea
          name="description"
          defaultValue={achievement?.description ?? ''}
          rows={5}
          placeholder="Describe the achievement in detail…"
          className={inputCls(!!fieldErrors.description)}
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Category" error={fieldErrors.category?.[0]}>
          <select
            name="category"
            defaultValue={achievement?.category ?? ''}
            className={inputCls(false)}
          >
            <option value="">No category</option>
            {ACHIEVEMENT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Date achieved" error={fieldErrors.dateAchieved?.[0]}>
          <input
            name="dateAchieved"
            type="date"
            defaultValue={defaultDate}
            className={inputCls(!!fieldErrors.dateAchieved)}
          />
        </Field>
      </div>

      <Field label="Impact rating" error={fieldErrors.impactRating?.[0]}>
        <StarRating value={impactRating} onChange={setImpactRating} />
      </Field>

      {tasks.length > 0 && (
        <Field label="Linked task (optional)" error={fieldErrors.taskId?.[0]}>
          <select
            name="taskId"
            defaultValue={achievement?.taskId ?? ''}
            className={inputCls(!!fieldErrors.taskId)}
          >
            <option value="">No linked task</option>
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </Field>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Save achievement'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/achievements')}
          className="rounded-md px-4 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
