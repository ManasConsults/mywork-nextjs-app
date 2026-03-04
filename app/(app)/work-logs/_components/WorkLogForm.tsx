'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Task, WorkLog } from '@prisma/client';

import { createWorkLogSchema, updateWorkLogSchema } from '@/lib/schemas/work-log.schema';
import { createWorkLogAction, updateWorkLogAction } from '@/lib/actions/work-log';

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

  const isEdit = !!workLog;
  const defaultDate = workLog?.date
    ? new Date(workLog.date).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
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
        taskId: fd.get('taskId') as string,
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
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {rootError}
        </p>
      )}

      {!isEdit && (
        <Field label="Task" error={fieldErrors.taskId?.[0]}>
          <select
            name="taskId"
            defaultValue={defaultTaskId ?? ''}
            className={inputCls(!!fieldErrors.taskId)}
          >
            <option value="" disabled>
              Select a task…
            </option>
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </Field>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Field label="Date" error={fieldErrors.date?.[0]}>
          <input
            name="date"
            type="date"
            defaultValue={defaultDate}
            className={inputCls(!!fieldErrors.date)}
          />
        </Field>

        <Field label="Time spent (hours)" error={fieldErrors.timeSpent?.[0]}>
          <input
            name="timeSpent"
            type="number"
            step="0.25"
            min="0.25"
            max="24"
            defaultValue={workLog?.timeSpent ?? ''}
            placeholder="e.g. 1.5"
            className={inputCls(!!fieldErrors.timeSpent)}
          />
        </Field>
      </div>

      <Field label="Description" error={fieldErrors.description?.[0]}>
        <textarea
          name="description"
          defaultValue={workLog?.description ?? ''}
          rows={4}
          placeholder="What did you work on? (min 10 characters)"
          className={inputCls(!!fieldErrors.description)}
        />
      </Field>

      <Field label="Outcome (optional)" error={fieldErrors.outcome?.[0]}>
        <input
          name="outcome"
          defaultValue={workLog?.outcome ?? ''}
          placeholder="What was the result or outcome?"
          className={inputCls(!!fieldErrors.outcome)}
        />
      </Field>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Log work'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/work-logs')}
          className="rounded-md px-4 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
