'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Task } from '@prisma/client';

import { createTaskSchema, updateTaskSchema, TASK_STATUSES, TASK_PRIORITIES } from '@/lib/schemas/task.schema';
import { createTaskAction, updateTaskAction } from '@/lib/actions/task';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  returnTo?: string;
}

interface FieldErrors {
  title?: string[];
  description?: string[];
  status?: string[];
  priority?: string[];
  dueDate?: string[];
  tags?: string[];
}

export function TaskForm({ task, returnTo = '/tasks' }: TaskFormProps): React.JSX.Element {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rootError, setRootError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState(task?.status ?? 'BACKLOG');
  const [priority, setPriority] = useState(task?.priority ?? 'MEDIUM');

  const isEdit = !!task;
  const defaultDueDate = task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '';
  const defaultTags = task?.tags.join(', ') ?? '';

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const raw = {
      title: fd.get('title') as string,
      description: (fd.get('description') as string) || undefined,
      status,
      priority,
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
      router.push(returnTo);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {rootError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {rootError}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          defaultValue={task?.title ?? ''}
          placeholder="Task title"
          aria-invalid={!!fieldErrors.title}
          disabled={isPending}
        />
        {fieldErrors.title?.[0] && (
          <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.title[0]}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={task?.description ?? ''}
          rows={3}
          placeholder="Optional description"
          aria-invalid={!!fieldErrors.description}
          disabled={isPending}
        />
        {fieldErrors.description?.[0] && (
          <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.description[0]}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as typeof status)} disabled={isPending}>
            <SelectTrigger aria-invalid={!!fieldErrors.status}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TASK_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldErrors.status?.[0] && (
            <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.status[0]}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Priority</Label>
          <Select value={priority} onValueChange={(v) => setPriority(v as typeof priority)} disabled={isPending}>
            <SelectTrigger aria-invalid={!!fieldErrors.priority}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TASK_PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>
                  {PRIORITY_LABELS[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldErrors.priority?.[0] && (
            <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.priority[0]}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="dueDate">Due date</Label>
        <Input
          id="dueDate"
          name="dueDate"
          type="date"
          defaultValue={defaultDueDate}
          aria-invalid={!!fieldErrors.dueDate}
          disabled={isPending}
        />
        {fieldErrors.dueDate?.[0] && (
          <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.dueDate[0]}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tags">Tags (comma-separated)</Label>
        <Input
          id="tags"
          name="tags"
          defaultValue={defaultTags}
          placeholder="e.g. bug, auth, urgent"
          aria-invalid={!!fieldErrors.tags}
          disabled={isPending}
        />
        {fieldErrors.tags?.[0] && (
          <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.tags[0]}</p>
        )}
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Create task'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push(returnTo)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
