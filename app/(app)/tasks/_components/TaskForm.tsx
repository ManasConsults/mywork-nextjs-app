'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Task } from '@prisma/client';

import { createTaskSchema, updateTaskSchema, TASK_STATUSES, TASK_PRIORITIES } from '@/lib/schemas/task.schema';
import { createTaskAction, updateTaskAction } from '@/lib/actions/task';

const STATUS_LABELS: Record<string, string> = {
  BACKLOG: 'To Do',
  IN_PROGRESS: 'In Progress',
  BLOCKED: 'On Hold',
  DONE: 'Done',
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
};

interface TaskFormProps {
  task?: Task;
}

interface FieldErrors {
  title?: string[];
  description?: string[];
  status?: string[];
  priority?: string[];
  dueDate?: string[];
  tags?: string[];
}

export function TaskForm({ task }: TaskFormProps): React.JSX.Element {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rootError, setRootError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const isEdit = !!task;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const raw = {
      title: fd.get('title') as string,
      description: (fd.get('description') as string) || undefined,
      status: fd.get('status') as string,
      priority: fd.get('priority') as string,
      dueDate: (fd.get('dueDate') as string) || undefined,
      tags: (fd.get('tags') as string)
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    };

    const schema = isEdit ? updateTaskSchema : createTaskSchema;
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      setFieldErrors(parsed.error.flatten().fieldErrors as FieldErrors);
      return;
    }
    setFieldErrors({});
    setRootError(null);

    startTransition(async () => {
      const result = isEdit
        ? await updateTaskAction(task.id, parsed.data)
        : await createTaskAction(parsed.data as Parameters<typeof createTaskAction>[0]);

      if (!result.success) {
        setRootError(result.error.message);
        if (result.error.fields) setFieldErrors(result.error.fields as FieldErrors);
        return;
      }
      router.push('/tasks');
    });
  }

  const defaultDueDate = task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '';
  const defaultTags = task?.tags.join(', ') ?? '';

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
          defaultValue={task?.title ?? ''}
          placeholder="Task title"
          className={inputCls(!!fieldErrors.title)}
        />
      </Field>

      <Field label="Description" error={fieldErrors.description?.[0]}>
        <textarea
          name="description"
          defaultValue={task?.description ?? ''}
          rows={3}
          placeholder="Optional description"
          className={inputCls(!!fieldErrors.description)}
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Status" error={fieldErrors.status?.[0]}>
          <select name="status" defaultValue={task?.status ?? 'BACKLOG'} className={inputCls(false)}>
            {TASK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Priority" error={fieldErrors.priority?.[0]}>
          <select name="priority" defaultValue={task?.priority ?? 'MEDIUM'} className={inputCls(false)}>
            {TASK_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABELS[p]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Due date" error={fieldErrors.dueDate?.[0]}>
        <input name="dueDate" type="date" defaultValue={defaultDueDate} className={inputCls(!!fieldErrors.dueDate)} />
      </Field>

      <Field label="Tags (comma-separated)" error={fieldErrors.tags?.[0]}>
        <input name="tags" defaultValue={defaultTags} placeholder="e.g. bug, auth, urgent" className={inputCls(!!fieldErrors.tags)} />
      </Field>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Create task'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/tasks')}
          className="rounded-md px-4 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          Cancel
        </button>
      </div>
    </form>
  );
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
      <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

function inputCls(hasError: boolean) {
  return `w-full rounded-md border px-3 py-2 text-sm outline-none transition-colors focus:ring-2 focus:ring-teal-500/30 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:ring-zinc-50/20 ${
    hasError
      ? 'border-red-500 dark:border-red-500'
      : 'border-zinc-200 dark:border-zinc-700'
  }`;
}
