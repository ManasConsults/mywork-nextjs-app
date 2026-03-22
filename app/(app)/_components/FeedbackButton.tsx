'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { MessageSquarePlus, X, CheckCircle, Loader2 } from 'lucide-react';

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

const TYPE_OPTIONS = [
  { value: 'FEATURE_REQUEST' as FeedbackType, label: 'Feature Request' },
  { value: 'BUG' as FeedbackType, label: 'Bug' },
];
const DESC_WARN_THRESHOLD = 1800;
const DESC_MAX = 2000;

export function FeedbackButton(): React.JSX.Element {
  const pathname = usePathname();
  const feedbackModule = normaliseModuleFromPath(pathname);

  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const firstFocusRef = useRef<HTMLButtonElement>(null);

  // Focus first element when modal opens
  useEffect(() => {
    if (isOpen) {
      firstFocusRef.current?.focus();
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Escape key closes modal
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  function handleOpen() {
    setForm(INITIAL_FORM);
    setFieldErrors({});
    setGlobalError(null);
    setSuccess(false);
    setIsOpen(true);
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
          setIsOpen(false);
          setSuccess(false);
        }, 2000);
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

  const descLen = form.description.length;
  const descCountCls =
    descLen > DESC_MAX
      ? 'text-xs text-red-500 tabular-nums'
      : descLen > DESC_WARN_THRESHOLD
        ? 'text-xs text-amber-500 tabular-nums'
        : 'text-xs text-zinc-400 dark:text-zinc-500 tabular-nums';

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={handleOpen}
        className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors duration-150 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 min-h-11"
        aria-label="Give feedback"
      >
        <MessageSquarePlus size={16} aria-hidden="true" />
        <span className="hidden sm:inline">Feedback</span>
      </button>

      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-200 ease-out motion-reduce:transition-none ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal panel — slides up from bottom on mobile, centred dialog on sm+ */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-modal-title"
        aria-hidden={!isOpen}
        className={`fixed z-50 w-full bg-white dark:bg-zinc-900
          bottom-0 left-0 right-0 rounded-t-2xl
          sm:inset-0 sm:m-auto sm:max-w-lg sm:rounded-xl sm:h-fit
          transition-[transform,opacity] duration-200 ease-out motion-reduce:transition-none
          ${isOpen
            ? 'translate-y-0 opacity-100 sm:scale-100'
            : 'translate-y-full opacity-0 sm:scale-95 sm:translate-y-0 pointer-events-none'
          }`}
      >
        {/* Drag handle — mobile only */}
        <div className="mx-auto mb-4 mt-3 h-1 w-10 rounded-full bg-zinc-200 dark:bg-zinc-700 sm:hidden" aria-hidden="true" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <h2
            id="feedback-modal-title"
            className="text-base font-semibold text-zinc-900 dark:text-zinc-50"
          >
            Give Feedback
          </h2>
          <button
            onClick={handleClose}
            className="flex h-11 w-11 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            aria-label="Close feedback form"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {success ? (
          /* Success state */
          <div className="flex flex-col items-center gap-3 px-5 py-12">
            <CheckCircle size={40} className="text-teal-500" aria-hidden="true" />
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              Thanks for your feedback!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="space-y-4 px-5 py-5">
              {/* Type selector — segmented full-width */}
              <fieldset>
                <legend className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Type <span className="text-red-500" aria-hidden="true">*</span>
                </legend>
                <div className="flex gap-2">
                  {TYPE_OPTIONS.map(({ value, label }) => (
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
                  maxLength={DESC_MAX}
                  rows={4}
                  placeholder="Describe in detail..."
                  className="w-full resize-none rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder:text-zinc-500"
                  aria-describedby={fieldErrors.description ? 'feedback-description-error' : undefined}
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
                  <span className={`shrink-0 ${descCountCls}`}>
                    {descLen}/{DESC_MAX}
                  </span>
                </div>
              </div>

              {/* Module — read-only pill */}
              <div>
                <p className="mb-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">Module</p>
                <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                  {feedbackModule}
                </span>
              </div>

              {/* Global error */}
              {globalError && (
                <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                  {globalError}
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="flex flex-col-reverse gap-2 border-t border-zinc-200 px-5 py-4 dark:border-zinc-800 sm:flex-row sm:justify-end">
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
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:opacity-60 dark:bg-teal-700 dark:hover:bg-teal-600"
              >
                {submitting && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
