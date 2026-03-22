'use client';

import { useState } from 'react';

import { updateFeedbackStatusAction } from '@/lib/actions/feedback';

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
  { value: 'RESOLVED', label: 'Resolved' },
] as const;

function TypeBadge({ type }: { type: string }): React.JSX.Element {
  if (type === 'BUG') {
    return (
      <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
        Bug
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-700 dark:bg-teal-900/30 dark:text-teal-400">
      Feature Request
    </span>
  );
}

export function FeedbackDetailPanel({ submission, onClose, onStatusUpdated }: Props): React.JSX.Element {
  const [status, setStatus] = useState(submission.status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStatusChange(newStatus: string) {
    setStatus(newStatus);
    setError(null);
    setSaving(true);
    try {
      const result = await updateFeedbackStatusAction(submission.id, newStatus);
      if (result.success) {
        onStatusUpdated(submission.id, newStatus);
      } else {
        setError(result.error.message);
        setStatus(submission.status); // revert
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-modal="true"
      role="dialog"
      aria-labelledby="feedback-detail-title"
    >
      {/* Slide-over panel */}
      <div className="flex h-full w-full max-w-lg flex-col bg-white shadow-xl dark:bg-zinc-900">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-700">
          <div className="min-w-0 pr-4">
            <h2
              id="feedback-detail-title"
              className="text-base font-semibold text-zinc-900 dark:text-zinc-50 leading-snug"
            >
              {submission.title}
            </h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <TypeBadge type={submission.type} />
              <span className="text-xs text-zinc-400 dark:text-zinc-500">{submission.module}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            aria-label="Close detail panel"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {/* Description */}
          <section>
            <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Description
            </h3>
            <p className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
              {submission.description}
            </p>
          </section>

          {/* Metadata */}
          <section className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Submitted by
              </p>
              <p className="mt-0.5 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                {submission.user.name ?? <span className="italic text-zinc-400">No name</span>}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{submission.user.email}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Date
              </p>
              <p className="mt-0.5 text-sm text-zinc-700 dark:text-zinc-300 tabular-nums">
                {new Date(submission.createdAt).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>
          </section>

          {/* Status update */}
          <section>
            <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Status
            </h3>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  disabled={saving}
                  onClick={() => handleStatusChange(opt.value)}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-60 ${
                    status === opt.value
                      ? 'border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-600'
                      : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-600'
                  }`}
                  aria-pressed={status === opt.value}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {saving && (
              <p className="mt-1.5 text-xs text-zinc-400 dark:text-zinc-500">Saving...</p>
            )}
            {error && (
              <p className="mt-1.5 text-xs text-red-600 dark:text-red-400" role="alert">
                {error}
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
