'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import {
  sendInvoiceAction,
  markPaidAction,
  cancelInvoiceAction,
  revertToDraftAction,
  sendPaymentReminderAction,
} from '@/lib/actions/finance/invoice';
import type { ResolvedStatus } from '@/lib/services/finance/invoice.service';

interface InvoiceActionsProps {
  invoiceId: string;
  status: ResolvedStatus;
  reminderCount: number;
  lastReminderAt: Date | null;
}

export function InvoiceActions({
  invoiceId,
  status,
  reminderCount,
  lastReminderAt,
}: InvoiceActionsProps): React.JSX.Element {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [emailWarning, setEmailWarning] = useState<string | null>(null);

  function run(
    action: () => Promise<{
      success: boolean;
      error?: { message: string } | undefined;
      emailWarning?: string;
    }>,
  ) {
    setError(null);
    setEmailWarning(null);
    startTransition(async () => {
      const result = await action();
      if (!result.success && result.error) {
        setError(result.error.message);
        return;
      }
      if ('emailWarning' in result && result.emailWarning) {
        setEmailWarning(result.emailWarning);
      }
      router.refresh();
    });
  }

  function handleSend() {
    run(() => sendInvoiceAction(invoiceId));
  }

  function handleMarkPaid() {
    run(() => markPaidAction(invoiceId));
  }

  function handleCancel() {
    if (!window.confirm('Are you sure you want to cancel this invoice? This cannot be undone.')) {
      return;
    }
    run(() => cancelInvoiceAction(invoiceId));
  }

  function handleRevertToDraft() {
    if (!window.confirm('Revert this invoice to draft? Totals will be cleared and linked work logs will be un-billed.')) {
      return;
    }
    run(() => revertToDraftAction(invoiceId));
  }

  function handleSendReminder() {
    run(() => sendPaymentReminderAction(invoiceId));
  }

  const lastReminderFormatted = lastReminderAt
    ? new Date(lastReminderAt).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : null;

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
          {error}
        </div>
      )}

      {emailWarning && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400">
          {emailWarning}
        </div>
      )}

      {(status === 'SENT' || status === 'OVERDUE') && reminderCount > 0 && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400">
          {reminderCount} reminder{reminderCount !== 1 ? 's' : ''} sent
          {lastReminderFormatted ? ` · last on ${lastReminderFormatted}` : ''}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {status === 'DRAFT' && (
          <>
            <ActionButton
              onClick={handleSend}
              disabled={isPending}
              variant="primary"
              label="Send Invoice"
            />
            <ActionButton
              onClick={handleCancel}
              disabled={isPending}
              variant="danger"
              label="Cancel Invoice"
            />
          </>
        )}

        {(status === 'SENT' || status === 'OVERDUE') && (
          <>
            <ActionButton
              onClick={handleMarkPaid}
              disabled={isPending}
              variant="success"
              label="Mark Paid"
            />
            <ActionButton
              onClick={handleSendReminder}
              disabled={isPending}
              variant="secondary"
              label="Send Notification"
            />
            <ActionButton
              onClick={handleRevertToDraft}
              disabled={isPending}
              variant="secondary"
              label="Revert to Draft"
            />
            <ActionButton
              onClick={handleCancel}
              disabled={isPending}
              variant="danger"
              label="Cancel Invoice"
            />
          </>
        )}
      </div>
    </div>
  );
}

function ActionButton({
  onClick,
  disabled,
  variant,
  label,
}: {
  onClick: () => void;
  disabled: boolean;
  variant: 'primary' | 'secondary' | 'danger' | 'success';
  label: string;
}): React.JSX.Element {
  const cls: Record<typeof variant, string> = {
    primary:
      'bg-teal-600 text-white hover:bg-teal-700',
    secondary:
      'border border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800',
    danger:
      'border border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20',
    success:
      'bg-green-600 text-white hover:bg-green-700',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        'rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50',
        cls[variant],
      ].join(' ')}
    >
      {label}
    </button>
  );
}
