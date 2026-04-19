'use client';

import { useState } from 'react';
import { X, Loader2, Trash2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { updateFeedbackStatusAction, deleteFeedbackSubmissionAction } from '@/lib/actions/feedback';

interface FeedbackSubmissionRow {
  id: string;
  type: string;
  status: string;
  title: string;
  description: string;
  module: string;
  createdAt: string;
  user: { name: string | null; email: string };
}

interface Props {
  submission: FeedbackSubmissionRow;
  onClose: () => void;
  onStatusUpdated: (id: string, newStatus: string) => void;
}

const STATUS_OPTIONS = [
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_REVIEW', label: 'In Review' },
  { value: 'DEFERRED', label: 'Deferred' },
  { value: 'RESOLVED', label: 'Resolved' },
] as const;

// ─── Badges ───────────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: string }): React.JSX.Element {
  if (type === 'BUG') {
    return (
      <span className="inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
        Bug
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-primary/5 px-2 py-0.5 text-xs font-medium text-primary">
      Feature Request
    </span>
  );
}

function StatusBadge({ status }: { status: string }): React.JSX.Element {
  if (status === 'IN_REVIEW') {
    return (
      <span className="inline-flex items-center rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning transition-colors duration-200">
        In Review
      </span>
    );
  }
  if (status === 'DEFERRED') {
    return (
      <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary transition-colors duration-200">
        Deferred
      </span>
    );
  }
  if (status === 'RESOLVED') {
    return (
      <span className="inline-flex items-center rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success transition-colors duration-200">
        Resolved
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground transition-colors duration-200">
      Open
    </span>
  );
}

// ─── Avatar initials ──────────────────────────────────────────────────────────

function getInitials(name: string | null, email: string): string {
  if (name) {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// ─── Panel ────────────────────────────────────────────────────────────────────

export function FeedbackDetailPanel({ submission, onClose, onStatusUpdated }: Props): React.JSX.Element {
  const [status, setStatus] = useState(submission.status);
  const [savingStatus, setSavingStatus] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleStatusChange(newStatus: string) {
    setSavingStatus(newStatus);
    setStatusError(null);
    try {
      const result = await updateFeedbackStatusAction(submission.id, newStatus);
      if (result.success) {
        setStatus(newStatus);
        onStatusUpdated(submission.id, newStatus);
      } else {
        setStatusError(result.error.message);
      }
    } finally {
      setSavingStatus(null);
    }
  }

  async function handleDelete() {
    if (!confirm('Permanently delete this submission? This cannot be undone.')) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const result = await deleteFeedbackSubmissionAction(submission.id);
      if (result.success) {
        onClose();
      } else {
        setDeleteError(result.error.message);
      }
    } finally {
      setDeleting(false);
    }
  }

  const initials = getInitials(submission.user.name, submission.user.email);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-200 motion-reduce:transition-none"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel — bottom sheet on mobile, right slide-over on md+ */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-detail-title"
        className="fixed z-50 bg-card shadow-xl
          bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-2xl
          md:bottom-auto md:top-0 md:right-0 md:left-auto md:h-full md:w-120 md:rounded-none md:rounded-l-2xl md:max-h-none"
      >
        {/* Drag handle — mobile only */}
        <div className="mx-auto mb-4 mt-3 h-1 w-10 rounded-full bg-muted md:hidden" aria-hidden="true" />

        {/* Header */}
        <div className="flex items-start justify-between border-b border-border px-5 py-4">
          <div className="min-w-0 pr-4">
            <h2
              id="feedback-detail-title"
              className="text-base font-semibold leading-snug text-foreground"
            >
              {submission.title}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <TypeBadge type={submission.type} />
              <StatusBadge status={status} />
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Close detail panel"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-5 px-5 py-5">

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Avatar */}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {submission.user.name ?? <span className="italic text-muted-foreground">No name</span>}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {submission.user.email}
              </p>
            </div>
            <span className="ml-auto inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
              {submission.module}
            </span>
            <span className="text-xs tabular-nums text-muted-foreground">
              {formatDate(submission.createdAt)}
            </span>
          </div>

          <hr className="border-border" />

          {/* Description */}
          <section>
            <p className="whitespace-pre-wrap text-sm text-foreground">
              {submission.description}
            </p>
          </section>

          <hr className="border-border" />

          {/* Status update */}
          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Update Status
            </p>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((opt) => {
                const isActive = status === opt.value;
                const isSaving = savingStatus === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={savingStatus !== null}
                    onClick={() => handleStatusChange(opt.value)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-200 disabled:opacity-60',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'border border-border text-muted-foreground hover:bg-accent hover:text-foreground',
                    )}
                    aria-pressed={isActive}
                  >
                    {isSaving && (
                      <Loader2 size={12} className="animate-spin" aria-hidden="true" />
                    )}
                    {opt.label}
                  </button>
                );
              })}
            </div>
            {statusError && (
              <p className="mt-1.5 text-xs text-destructive" role="alert">
                {statusError}
              </p>
            )}
          </section>
        </div>

        {/* Footer — delete */}
        <div className="border-t border-border px-5 py-4">
          {deleteError && (
            <p className="mb-2 text-xs text-destructive" role="alert">
              {deleteError}
            </p>
          )}
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-destructive/30 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-60"
          >
            {deleting
              ? <Loader2 size={14} className="animate-spin" aria-hidden="true" />
              : <Trash2 size={14} aria-hidden="true" />
            }
            {deleting ? 'Deleting…' : 'Delete submission'}
          </button>
        </div>
      </div>
    </>
  );
}
