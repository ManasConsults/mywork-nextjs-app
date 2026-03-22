'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

import { submitFeedbackAction } from '@/lib/actions/feedback';
import { normaliseModuleFromPath } from '@/lib/utils/feedback-module';
import type { CreateFeedbackInput } from '@/lib/schemas/feedback.schema';

type FeedbackType = 'FEATURE_REQUEST' | 'BUG';

interface FieldErrors {
  type?: string[];
  title?: string[];
  description?: string[];
  module?: string[];
}

interface FormState {
  type: FeedbackType | '';
  title: string;
  description: string;
}

const INITIAL_FORM: FormState = { type: '', title: '', description: '' };

export function FeedbackButton(): React.JSX.Element {
  const pathname = usePathname();
  const feedbackModule = normaliseModuleFromPath(pathname);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFocusRef = useRef<HTMLButtonElement>(null);

  // Focus first element when modal opens
  useEffect(() => {
    if (open) {
      firstFocusRef.current?.focus();
    }
  }, [open]);

  // Escape key closes modal
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  function handleOpen() {
    setForm(INITIAL_FORM);
    setFieldErrors({});
    setGlobalError(null);
    setSuccess(false);
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
  }

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
      handleClose();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    setGlobalError(null);

    if (!form.type) {
      setFieldErrors({ type: ['Please select a type'] });
      return;
    }

    setSubmitting(true);
    try {
      const input: CreateFeedbackInput = {
        type: form.type as FeedbackType,
        title: form.title,
        description: form.description,
        module: feedbackModule,
      };

      const result = await submitFeedbackAction(input);

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          setOpen(false);
          setSuccess(false);
        }, 1800);
      } else {
        if (result.error.fields) {
          setFieldErrors(result.error.fields as FieldErrors);
        }
        setGlobalError(result.error.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
        aria-label="Give feedback"
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
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span className="hidden sm:inline">Feedback</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={handleBackdropClick}
          aria-modal="true"
          role="dialog"
          aria-labelledby="feedback-modal-title"
        >
          <div
            ref={dialogRef}
            className="w-full max-w-md rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-700">
              <h2
                id="feedback-modal-title"
                className="text-base font-semibold text-zinc-900 dark:text-zinc-50"
              >
                Give Feedback
              </h2>
              <button
                onClick={handleClose}
                className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                aria-label="Close feedback modal"
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

            {success ? (
              <div className="flex flex-col items-center gap-3 px-5 py-10">
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-teal-500"
                  aria-hidden="true"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <path d="M22 4L12 14.01l-3-3" />
                </svg>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  Thanks for your feedback!
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <div className="space-y-4 px-5 py-5">
                  {/* Type selector */}
                  <fieldset>
                    <legend className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Type <span className="text-red-500" aria-hidden="true">*</span>
                    </legend>
                    <div className="flex gap-2">
                      {(
                        [
                          { value: 'FEATURE_REQUEST', label: 'Feature Request' },
                          { value: 'BUG', label: 'Bug' },
                        ] as { value: FeedbackType; label: string }[]
                      ).map(({ value, label }) => (
                        <button
                          key={value}
                          type="button"
                          ref={value === 'FEATURE_REQUEST' ? firstFocusRef : undefined}
                          onClick={() => setForm((f) => ({ ...f, type: value }))}
                          className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                            form.type === value
                              ? 'border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-600'
                              : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-600'
                          }`}
                          aria-pressed={form.type === value}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    {fieldErrors.type && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400" role="alert">
                        {fieldErrors.type[0]}
                      </p>
                    )}
                  </fieldset>

                  {/* Title */}
                  <div>
                    <label
                      htmlFor="feedback-title"
                      className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                    >
                      Title <span className="text-red-500" aria-hidden="true">*</span>
                    </label>
                    <input
                      id="feedback-title"
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                      maxLength={200}
                      placeholder="Brief summary"
                      className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder:text-zinc-500"
                      aria-describedby={fieldErrors.title ? 'feedback-title-error' : undefined}
                    />
                    {fieldErrors.title && (
                      <p
                        id="feedback-title-error"
                        className="mt-1 text-xs text-red-600 dark:text-red-400"
                        role="alert"
                      >
                        {fieldErrors.title[0]}
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label
                      htmlFor="feedback-description"
                      className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                    >
                      Description <span className="text-red-500" aria-hidden="true">*</span>
                    </label>
                    <textarea
                      id="feedback-description"
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      maxLength={2000}
                      rows={4}
                      placeholder="Describe in detail..."
                      className="w-full resize-none rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder:text-zinc-500"
                      aria-describedby={
                        fieldErrors.description ? 'feedback-description-error' : undefined
                      }
                    />
                    <div className="mt-0.5 flex items-start justify-between gap-2">
                      {fieldErrors.description ? (
                        <p
                          id="feedback-description-error"
                          className="text-xs text-red-600 dark:text-red-400"
                          role="alert"
                        >
                          {fieldErrors.description[0]}
                        </p>
                      ) : (
                        <span />
                      )}
                      <span className="shrink-0 text-xs text-zinc-400 tabular-nums">
                        {form.description.length}/2000
                      </span>
                    </div>
                  </div>

                  {/* Module — read-only */}
                  <div>
                    <p className="mb-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Module
                    </p>
                    <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-400">
                      {feedbackModule}
                    </div>
                  </div>

                  {/* Global error */}
                  {globalError && (
                    <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                      {globalError}
                    </p>
                  )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 border-t border-zinc-200 px-5 py-4 dark:border-zinc-700">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:opacity-60 dark:bg-teal-700 dark:hover:bg-teal-600"
                  >
                    {submitting ? 'Submitting...' : 'Submit'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
