'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { MessageSquarePlus, X, CheckCircle, Loader2 } from 'lucide-react';

import { submitFeedbackAction } from '@/lib/actions/feedback';
import { normaliseModuleFromPath } from '@/lib/utils/feedback-module';
import type { CreateFeedbackInput } from '@/lib/schemas/feedback.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

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

  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const firstFocusRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) firstFocusRef.current?.focus();
  }, [isOpen]);

  const handleClose = useCallback(() => setIsOpen(false), []);

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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
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
        setTimeout(() => { setIsOpen(false); setSuccess(false); }, 2000);
      } else {
        if (result.error.fields) setFieldErrors(result.error.fields as FieldErrors);
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
        : 'text-xs text-muted-foreground tabular-nums';

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleOpen}
        aria-label="Give feedback"
        className="gap-1.5 min-h-11"
      >
        <MessageSquarePlus size={16} aria-hidden="true" />
        <span className="hidden sm:inline">Feedback</span>
      </Button>

      {mounted && createPortal(
        <>
          {/* Backdrop */}
          <div
            className={`fixed inset-0 z-200 bg-black/40 backdrop-blur-sm transition-opacity duration-200 ease-out motion-reduce:transition-none ${
              isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Modal */}
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="feedback-modal-title"
            aria-hidden={!isOpen}
            className={`fixed z-201 w-full bg-background border border-border
              bottom-0 left-0 right-0 rounded-t-2xl
              sm:inset-0 sm:m-auto sm:max-w-lg sm:rounded-xl sm:h-fit
              transition-[transform,opacity] duration-200 ease-out motion-reduce:transition-none
              ${isOpen
                ? 'translate-y-0 opacity-100 sm:scale-100'
                : 'translate-y-full opacity-0 sm:scale-95 sm:translate-y-0 pointer-events-none'
              }`}
          >
            <div className="mx-auto mb-4 mt-3 h-1 w-10 rounded-full bg-muted sm:hidden" aria-hidden="true" />

            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 id="feedback-modal-title" className="text-base font-semibold text-foreground">
                Give Feedback
              </h2>
              <Button variant="ghost" size="icon" onClick={handleClose} aria-label="Close feedback form" className="h-11 w-11">
                <X size={16} aria-hidden="true" />
              </Button>
            </div>

            {success ? (
              <div className="flex flex-col items-center gap-3 px-5 py-12">
                <CheckCircle size={40} className="text-primary" aria-hidden="true" />
                <p className="text-sm font-medium text-foreground">Thanks for your feedback!</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <div className="space-y-4 px-5 py-5">
                  {/* Type selector */}
                  <fieldset>
                    <legend className="mb-1.5 block text-sm font-medium text-foreground">
                      Type <span className="text-destructive" aria-hidden="true">*</span>
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
                              ? 'border-primary/80 bg-primary/5 text-primary dark:border-primary'
                              : 'border-border bg-background text-muted-foreground hover:border-border hover:bg-accent/40'
                          }`}
                          aria-pressed={form.type === value}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    {fieldErrors.type && <p className="mt-1 text-xs text-destructive" role="alert">{fieldErrors.type[0]}</p>}
                  </fieldset>

                  {/* Title */}
                  <div className="space-y-1.5">
                    <Label htmlFor="feedback-title">
                      Title <span className="text-destructive" aria-hidden="true">*</span>
                    </Label>
                    <Input
                      id="feedback-title"
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                      maxLength={200}
                      placeholder="Brief summary"
                      aria-describedby={fieldErrors.title ? 'feedback-title-error' : undefined}
                    />
                    {fieldErrors.title && <p id="feedback-title-error" className="text-xs text-destructive" role="alert">{fieldErrors.title[0]}</p>}
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <Label htmlFor="feedback-description">
                      Description <span className="text-destructive" aria-hidden="true">*</span>
                    </Label>
                    <Textarea
                      id="feedback-description"
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      maxLength={DESC_MAX}
                      rows={4}
                      placeholder="Describe in detail..."
                      aria-describedby={fieldErrors.description ? 'feedback-description-error' : undefined}
                    />
                    <div className="flex items-start justify-between gap-2">
                      {fieldErrors.description
                        ? <p id="feedback-description-error" className="text-xs text-destructive" role="alert">{fieldErrors.description[0]}</p>
                        : <span />
                      }
                      <span className={`shrink-0 ${descCountCls}`}>{descLen}/{DESC_MAX}</span>
                    </div>
                  </div>

                  {/* Module */}
                  <div>
                    <p className="mb-1.5 text-sm font-medium text-foreground">Module</p>
                    <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                      {feedbackModule}
                    </span>
                  </div>

                  {globalError && <p className="text-sm text-destructive" role="alert">{globalError}</p>}
                </div>

                <div className="flex flex-col-reverse gap-2 border-t border-border px-5 py-4 sm:flex-row sm:justify-end">
                  <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
                  <Button type="submit" disabled={submitting} className="gap-2">
                    {submitting && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
                    {submitting ? 'Submitting...' : 'Submit'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </>,
        document.body,
      )}
    </>
  );
}
