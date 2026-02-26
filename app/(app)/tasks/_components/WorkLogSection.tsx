'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { WorkLog } from '@prisma/client';

import { createWorkLogSchema } from '@/lib/schemas/work-log.schema';
import { createWorkLogAction, deleteWorkLogAction } from '@/lib/actions/work-log';

interface FieldErrors {
  date?: string[];
  description?: string[];
  timeSpent?: string[];
  outcome?: string[];
}

interface WorkLogSectionProps {
  taskId: string;
  initialLogs: WorkLog[];
}

function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function inputCls(hasError: boolean) {
  return `w-full rounded-md border px-3 py-2 text-sm outline-none transition-colors focus:ring-2 focus:ring-teal-500/30 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:ring-zinc-50/20 ${
    hasError ? 'border-red-500 dark:border-red-500' : 'border-zinc-200 dark:border-zinc-700'
  }`;
}

export function WorkLogSection({ taskId, initialLogs }: WorkLogSectionProps): React.JSX.Element {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [rootError, setRootError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

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
      setShowForm(false);
      router.refresh();
    });
  }

  function handleDelete(workLogId: string) {
    if (!confirm('Delete this work log entry?')) return;
    setDeletingId(workLogId);
    startTransition(async () => {
      await deleteWorkLogAction(workLogId);
      setDeletingId(null);
      router.refresh();
    });
  }

  const today = new Date().toISOString().split('T')[0];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Work Logs
          <span className="ml-2 text-sm font-normal text-zinc-500 dark:text-zinc-400">
            ({initialLogs.length})
          </span>
        </h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-md bg-teal-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-teal-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            + Add log
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleAdd}
          className="mb-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50"
        >
          {rootError && (
            <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
              {rootError}
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Date
              </label>
              <input
                name="date"
                type="date"
                defaultValue={today}
                className={inputCls(!!fieldErrors.date)}
              />
              {fieldErrors.date && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.date[0]}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Time spent (hours)
              </label>
              <input
                name="timeSpent"
                type="number"
                step="0.25"
                min="0.25"
                max="24"
                placeholder="e.g. 1.5"
                className={inputCls(!!fieldErrors.timeSpent)}
              />
              {fieldErrors.timeSpent && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.timeSpent[0]}</p>
              )}
            </div>
          </div>
          <div className="mt-3">
            <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Description
            </label>
            <textarea
              name="description"
              rows={3}
              placeholder="What did you work on?"
              className={inputCls(!!fieldErrors.description)}
            />
            {fieldErrors.description && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.description[0]}</p>
            )}
          </div>
          <div className="mt-3">
            <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Outcome (optional)
            </label>
            <input
              name="outcome"
              placeholder="What was the result?"
              className={inputCls(!!fieldErrors.outcome)}
            />
            {fieldErrors.outcome && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.outcome[0]}</p>
            )}
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-teal-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {isPending ? 'Saving…' : 'Save log'}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setFieldErrors({}); setRootError(null); }}
              className="rounded-md px-3 py-1.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-700"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {initialLogs.length === 0 && !showForm ? (
        <div className="rounded-lg border border-dashed border-zinc-200 py-8 text-center dark:border-zinc-700">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No work logs yet.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {initialLogs.map((log) => (
            <li
              key={log.id}
              className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900"
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  {new Date(log.date).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-2">
                  {log.timeSpent != null && (
                    <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700 dark:bg-teal-900/30 dark:text-teal-300">
                      {formatHours(log.timeSpent)}
                    </span>
                  )}
                  <Link
                    href={`/work-logs/${log.id}/edit`}
                    className="text-xs text-zinc-500 underline hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(log.id)}
                    disabled={deletingId === log.id || isPending}
                    className="text-xs text-red-500 underline hover:text-red-700 disabled:opacity-50 dark:text-red-400"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <p className="text-sm text-zinc-700 dark:text-zinc-300">{log.description}</p>
              {log.outcome && (
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="font-medium">Outcome:</span> {log.outcome}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
