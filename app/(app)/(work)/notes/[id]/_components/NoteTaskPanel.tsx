import Link from 'next/link';
import type { Task, WorkLog } from '@prisma/client';

const STATUS_LABELS: Record<string, string> = {
  BACKLOG: 'To Do',
  IN_PROGRESS: 'In Progress',
  BLOCKED: 'On Hold',
  IN_REVIEW: 'In Review',
  DONE: 'Done',
};

const STATUS_CLASSES: Record<string, string> = {
  BACKLOG: 'bg-muted text-muted-foreground',
  IN_PROGRESS: 'bg-primary/10 text-primary',
  BLOCKED: 'bg-destructive/10 text-destructive',
  IN_REVIEW: 'bg-warning/15 text-warning-foreground',
  DONE: 'bg-success/10 text-success',
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
};

const PRIORITY_CLASSES: Record<string, string> = {
  LOW: 'bg-muted text-muted-foreground',
  MEDIUM: 'bg-warning/15 text-warning-foreground',
  HIGH: 'bg-destructive/10 text-destructive',
  CRITICAL: 'bg-destructive text-destructive-foreground',
};

interface NoteTaskPanelProps {
  task: Task;
  workLogs: WorkLog[];
}

export function NoteTaskPanel({ task, workLogs }: NoteTaskPanelProps): React.JSX.Element {
  const now = new Date();
  const isOverdue =
    task.dueDate !== null &&
    task.status !== 'DONE' &&
    new Date(task.dueDate) < now;

  const totalHours = workLogs.reduce((sum, l) => sum + (l.timeSpent ?? 0), 0);
  const visibleLogs = workLogs.slice(0, 5);

  return (
    <aside className="space-y-3">
      {/* ── Linked task ── */}
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Linked Task
        </p>

        <Link
          href={`/tasks/${task.id}`}
          className="mb-3 block text-sm font-semibold text-foreground hover:text-primary"
        >
          {task.title}
        </Link>

        <div className="flex flex-wrap gap-1.5">
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[task.status] ?? STATUS_CLASSES.BACKLOG}`}
          >
            {STATUS_LABELS[task.status] ?? task.status}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_CLASSES[task.priority] ?? PRIORITY_CLASSES.MEDIUM}`}
          >
            {PRIORITY_LABELS[task.priority] ?? task.priority}
          </span>
        </div>

        {task.dueDate !== null && (
          <p className={`mt-3 text-xs ${isOverdue ? 'font-medium text-destructive' : 'text-muted-foreground'}`}>
            {isOverdue ? '⚠ Overdue · ' : 'Due '}
            {new Date(task.dueDate).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </p>
        )}
      </div>

      {/* ── Work logs ── */}
      {workLogs.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Work Logs
            </p>
            {totalHours > 0 && (
              <span className="text-xs text-muted-foreground">
                {totalHours % 1 === 0 ? totalHours : totalHours.toFixed(1)} hrs total
              </span>
            )}
          </div>

          <ul className="space-y-0">
            {visibleLogs.map((log, i) => (
              <li
                key={log.id}
                className={`py-2.5 ${i < visibleLogs.length - 1 ? 'border-b border-border' : ''}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">
                    {new Date(log.date).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                  {log.timeSpent != null && (
                    <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                      {log.timeSpent % 1 === 0 ? log.timeSpent : log.timeSpent.toFixed(1)}h
                    </span>
                  )}
                </div>
                <p className="mt-0.5 line-clamp-2 text-xs text-foreground">
                  {log.description}
                </p>
              </li>
            ))}
          </ul>

          {workLogs.length > 5 && (
            <Link
              href={`/work-logs?taskId=${task.id}`}
              className="mt-2 block text-center text-xs text-primary hover:underline"
            >
              View all {workLogs.length} logs →
            </Link>
          )}
        </div>
      )}

      {workLogs.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Work Logs
          </p>
          <p className="mt-2 text-xs text-muted-foreground">No work logs for this task yet.</p>
        </div>
      )}
    </aside>
  );
}
