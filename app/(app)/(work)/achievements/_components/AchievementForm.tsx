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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
          <span className={star <= (value ?? 0) ? 'text-amber-400' : 'text-muted-foreground/40'}>
            ★
          </span>
        </button>
      ))}
      {value != null && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="ml-1 text-xs text-muted-foreground underline hover:text-foreground"
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
  const [category, setCategory] = useState(achievement?.category ?? '');
  const [taskId, setTaskId] = useState(achievement?.taskId ?? '');

  const isEdit = !!achievement;
  const defaultDate = achievement?.dateAchieved
    ? new Date(achievement.dateAchieved).toISOString().split('T')[0]
    : '';

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const raw = {
      title: fd.get('title') as string,
      description: fd.get('description') as string,
      category: category || undefined,
      dateAchieved: (fd.get('dateAchieved') as string) || undefined,
      impactRating: impactRating ?? undefined,
      taskId: taskId || undefined,
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {rootError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {rootError}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          defaultValue={achievement?.title ?? ''}
          placeholder="What did you achieve?"
          aria-invalid={!!fieldErrors.title}
          disabled={isPending}
        />
        {fieldErrors.title?.[0] && (
          <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.title[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={achievement?.description ?? ''}
          rows={5}
          placeholder="Describe the achievement in detail…"
          aria-invalid={!!fieldErrors.description}
          disabled={isPending}
        />
        {fieldErrors.description?.[0] && (
          <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.description[0]}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label>Category</Label>
          <Select value={category} onValueChange={setCategory} disabled={isPending}>
            <SelectTrigger aria-invalid={!!fieldErrors.category}>
              <SelectValue placeholder="No category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">No category</SelectItem>
              {ACHIEVEMENT_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldErrors.category?.[0] && (
            <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.category[0]}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="dateAchieved">Date achieved</Label>
          <Input
            id="dateAchieved"
            name="dateAchieved"
            type="date"
            defaultValue={defaultDate}
            aria-invalid={!!fieldErrors.dateAchieved}
            disabled={isPending}
          />
          {fieldErrors.dateAchieved?.[0] && (
            <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.dateAchieved[0]}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Impact rating</Label>
        <StarRating value={impactRating} onChange={setImpactRating} />
        {fieldErrors.impactRating?.[0] && (
          <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.impactRating[0]}</p>
        )}
      </div>

      {tasks.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <Label>Linked task (optional)</Label>
          <Select value={taskId} onValueChange={setTaskId} disabled={isPending}>
            <SelectTrigger aria-invalid={!!fieldErrors.taskId}>
              <SelectValue placeholder="No linked task" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">No linked task</SelectItem>
              {tasks.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldErrors.taskId?.[0] && (
            <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.taskId[0]}</p>
          )}
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Save achievement'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push('/achievements')}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
