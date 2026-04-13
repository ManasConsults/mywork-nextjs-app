'use client';

import { useState } from 'react';
import { X, Loader2, Trash2 } from 'lucide-react';

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
      <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
        Bug
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700 dark:bg-teal-900/30 dark:text-teal-400">
      Feature Request
    </span>
  );
}

function StatusBadge({ status }: { status: string }): React.JSX.Element {
  if (status === 'IN_REVIEW') {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 transition-colors duration-200">
        In Review
      </span>
    );
  }
  if (status === 'DEFERRED') {
    return (
      <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 transition-colors duration-200">
        Deferred
      </span>
    );
  }
  if (status === 'RESOLVED') {
    return (
      <span className="inline-flex items-center rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 transition-colors duration-200">
        Resolved
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 transition-colors duration-200">
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
        className="fixed z-50 bg-white dark:bg-zinc-900 shadow-xl
          bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-2xl
          md:bottom-auto md:top-0 md:right-0 md:left-auto md:h-full md:w-120 md:rounded-none md:rounded-l-2xl md:max-h-none"
      >
        {/* Drag handle — mobile only */}
        <div className="mx-auto mb-4 mt-3 h-1 w-10 rounded-full bg-zinc-200 dark:bg-zinc-700 md:hidden" aria-hidden="true" />

        {/* Header */}
        <div className="flex items-start justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <div className="min-w-0 pr-4">
            <h2
              id="feedback-detail-title"
              className="text-base font-semibold leading-snug text-zinc-900 dark:text-zinc-50"
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
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            aria-label="Close detail panel"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-5 px-5 py-5">

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Avatar */}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm font-semibold text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                {submission.user.name ?? <span className="italic text-zinc-400">No name</span>}
              </p>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                {submission.user.email}
              </p>
            </div>
            <span className="ml-auto inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              {submission.module}
            </span>
            <span className="text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
              {formatDate(submission.createdAt)}
            </span>
          </div>

          <hr className="border-zinc-200 dark:border-zinc-800" />

          {/* Description */}
          <section>
            <p className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
              {submission.description}
            </p>
          </section>

          <hr className="border-zinc-200 dark:border-zinc-800" />

          {/* Status update */}
          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
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
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-200 disabled:opacity-60 ${
                      isActive
                        ? 'bg-teal-600 text-white dark:bg-zinc-50 dark:text-zinc-900'
                        : 'border border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800'
                    }`}
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
              <p className="mt-1.5 text-xs text-red-600 dark:text-red-400" role="alert">
                {statusError}
              </p>
            )}
          </section>
        </div>

        {/* Footer — delete */}
        <div className="border-t border-zinc-200 px-5 py-4 dark:border-zinc-800">
          {deleteError && (
            <p className="mb-2 text-xs text-red-600 dark:text-red-400" role="alert">
              {deleteError}
            </p>
          )}
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20"
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
