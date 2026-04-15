'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Task, WorkLog } from '@prisma/client';

import { createWorkLogSchema, updateWorkLogSchema } from '@/lib/schemas/work-log.schema';
import { createWorkLogAction, updateWorkLogAction } from '@/lib/actions/work-log';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface FieldErrors {
  taskId?: string[];
  date?: string[];
  description?: string[];
  timeSpent?: string[];
  outcome?: string[];
}

interface WorkLogFormProps {
  tasks: Task[];
  workLog?: WorkLog;
  defaultTaskId?: string;
  /** When provided the form is in inline mode: calls onSuccess instead of navigating */
  onSuccess?: () => void;
}

export function WorkLogForm({
  tasks,
  workLog,
  defaultTaskId,
  onSuccess,
}: WorkLogFormProps): React.JSX.Element {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rootError, setRootError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [taskId, setTaskId] = useState(defaultTaskId ?? '');

  const isEdit = !!workLog;
  const defaultDate = workLog?.date
    ? new Date(workLog.date).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    if (isEdit) {
      const raw = {
        date: fd.get('date') as string,
        description: fd.get('description') as string,
        timeSpent: fd.get('timeSpent') ? Number(fd.get('timeSpent')) : undefined,
        outcome: (fd.get('outcome') as string) || undefined,
      };
      const parsed = updateWorkLogSchema.safeParse(raw);
      if (!parsed.success) {
        setFieldErrors(parsed.error.flatten().fieldErrors as FieldErrors);
        return;
      }
      setFieldErrors({});
      setRootError(null);

      startTransition(async () => {
        const result = await updateWorkLogAction(workLog.id, parsed.data);
        if (!result.success) {
          setRootError(result.error.message);
          if (result.error.fields) setFieldErrors(result.error.fields as FieldErrors);
          return;
        }
        if (onSuccess) onSuccess();
        else router.push('/work-logs');
      });
    } else {
      const raw = {
        taskId,
        date: fd.get('date') as string,
        description: fd.get('description') as string,
        timeSpent: fd.get('timeSpent') ? Number(fd.get('timeSpent')) : undefined,
        outcome: (fd.get('outcome') as string) || undefined,
      };
      const parsed = createWorkLogSchema.safeParse(raw);
      if (!parsed.success) {
        setFieldErrors(parsed.error.flatten().fieldErrors as FieldErrors);
        return;
      }
      setFieldErrors({});
      setRootError(null);

      startTransition(async () => {
        const result = await createWorkLogAction(parsed.data);
        if (!result.success) {
          setRootError(result.error.message);
          if (result.error.fields) setFieldErrors(result.error.fields as FieldErrors);
          return;
        }
        if (onSuccess) onSuccess();
        else router.push('/work-logs');
      });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {rootError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {rootError}
        </div>
      )}

      {!isEdit && (
        <div className="space-y-1.5">
          <Label>Task</Label>
          <Select value={taskId} onValueChange={setTaskId} disabled={isPending}>
            <SelectTrigger aria-invalid={!!fieldErrors.taskId}>
              <SelectValue placeholder="Select a task…" />
            </SelectTrigger>
            <SelectContent>
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            name="date"
            type="date"
            defaultValue={defaultDate}
            aria-invalid={!!fieldErrors.date}
            disabled={isPending}
          />
          {fieldErrors.date?.[0] && (
            <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.date[0]}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="timeSpent">Time spent (hours)</Label>
          <Input
            id="timeSpent"
            name="timeSpent"
            type="number"
            step="0.25"
            min="0.25"
            max="24"
            defaultValue={workLog?.timeSpent ?? ''}
            placeholder="e.g. 1.5"
            aria-invalid={!!fieldErrors.timeSpent}
            disabled={isPending}
          />
          {fieldErrors.timeSpent?.[0] && (
            <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.timeSpent[0]}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={workLog?.description ?? ''}
          rows={4}
          placeholder="What did you work on? (min 10 characters)"
          aria-invalid={!!fieldErrors.description}
          disabled={isPending}
        />
        {fieldErrors.description?.[0] && (
          <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.description[0]}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="outcome">Outcome (optional)</Label>
        <Input
          id="outcome"
          name="outcome"
          defaultValue={workLog?.outcome ?? ''}
          placeholder="What was the result or outcome?"
          aria-invalid={!!fieldErrors.outcome}
          disabled={isPending}
        />
        {fieldErrors.outcome?.[0] && (
          <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.outcome[0]}</p>
        )}
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Log work'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push('/work-logs')}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
