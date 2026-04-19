'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { WorkLog } from '@prisma/client';

import { createWorkLogSchema } from '@/lib/schemas/work-log.schema';
import { createWorkLogAction, deleteWorkLogAction } from '@/lib/actions/work-log';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

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
        <h2 className="text-lg font-semibold text-foreground">
          Work Logs
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            ({initialLogs.length})
          </span>
        </h2>
        {!showForm && (
          <Button size="sm" onClick={() => setShowForm(true)}>+ Add log</Button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="mb-4 rounded-lg border border-border bg-muted/50 p-4">
          {rootError && (
            <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">{rootError}</p>
          )}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Date</Label>
              <Input name="date" type="date" defaultValue={today} aria-invalid={!!fieldErrors.date} />
              {fieldErrors.date && <p className="text-xs text-red-600">{fieldErrors.date[0]}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Time spent (hours)</Label>
              <Input name="timeSpent" type="number" step="0.25" min="0.25" max="24" placeholder="e.g. 1.5" aria-invalid={!!fieldErrors.timeSpent} />
              {fieldErrors.timeSpent && <p className="text-xs text-red-600">{fieldErrors.timeSpent[0]}</p>}
            </div>
          </div>
          <div className="mt-3 flex flex-col gap-1">
            <Label className="text-xs">Description</Label>
            <Textarea name="description" rows={3} placeholder="What did you work on?" aria-invalid={!!fieldErrors.description} />
            {fieldErrors.description && <p className="text-xs text-red-600">{fieldErrors.description[0]}</p>}
          </div>
          <div className="mt-3 flex flex-col gap-1">
            <Label className="text-xs">Outcome (optional)</Label>
            <Input name="outcome" placeholder="What was the result?" aria-invalid={!!fieldErrors.outcome} />
            {fieldErrors.outcome && <p className="text-xs text-red-600">{fieldErrors.outcome[0]}</p>}
          </div>
          <div className="mt-3 flex gap-2">
            <Button type="submit" size="sm" disabled={isPending}>{isPending ? 'Saving…' : 'Save log'}</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => { setShowForm(false); setFieldErrors({}); setRootError(null); }}>Cancel</Button>
          </div>
        </form>
      )}

      {initialLogs.length === 0 && !showForm ? (
        <div className="rounded-lg border border-dashed border-border py-8 text-center">
          <p className="text-sm text-muted-foreground">No work logs yet.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {initialLogs.map((log) => (
            <li key={log.id} className="rounded-lg border border-border bg-card p-3">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  {new Date(log.date).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-2">
                  {log.timeSpent != null && (
                    <span className="rounded-full bg-primary/5 px-2 py-0.5 text-xs font-medium text-primary">
                      {formatHours(log.timeSpent)}
                    </span>
                  )}
                  <Link href={`/work-logs/${log.id}/edit`} className="text-xs text-muted-foreground underline hover:text-foreground">
                    Edit
                  </Link>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(log.id)} disabled={deletingId === log.id || isPending} className="h-auto p-0 text-xs text-red-500 underline hover:text-red-700 hover:bg-transparent dark:text-red-400">
                    Delete
                  </Button>
                </div>
              </div>
              <p className="text-sm text-foreground">{log.description}</p>
              {log.outcome && (
                <p className="mt-1 text-xs text-muted-foreground">
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
