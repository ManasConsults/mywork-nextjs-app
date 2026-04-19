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
import { Button } from '@/components/ui/button';

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

  function handleSend() { run(() => sendInvoiceAction(invoiceId)); }
  function handleMarkPaid() { run(() => markPaidAction(invoiceId)); }
  function handleCancel() {
    if (!window.confirm('Are you sure you want to cancel this invoice? This cannot be undone.')) return;
    run(() => cancelInvoiceAction(invoiceId));
  }
  function handleRevertToDraft() {
    if (!window.confirm('Revert this invoice to draft? Totals will be cleared and linked work logs will be un-billed.')) return;
    run(() => revertToDraftAction(invoiceId));
  }
  function handleSendReminder() { run(() => sendPaymentReminderAction(invoiceId)); }

  const lastReminderFormatted = lastReminderAt
    ? new Date(lastReminderAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : null;

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {emailWarning && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
          {emailWarning}
        </div>
      )}

      {(status === 'SENT' || status === 'OVERDUE') && reminderCount > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
          {reminderCount} reminder{reminderCount !== 1 ? 's' : ''} sent
          {lastReminderFormatted ? ` · last on ${lastReminderFormatted}` : ''}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {status === 'DRAFT' && (
          <>
            <Button onClick={handleSend} disabled={isPending}>Send Invoice</Button>
            <Button variant="outline" onClick={handleCancel} disabled={isPending} className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20">
              Cancel Invoice
            </Button>
          </>
        )}

        {(status === 'SENT' || status === 'OVERDUE') && (
          <>
            <Button onClick={handleMarkPaid} disabled={isPending} className="bg-green-600 hover:bg-green-700 text-white">
              Mark Paid
            </Button>
            <Button variant="outline" onClick={handleSendReminder} disabled={isPending}>
              Send Notification
            </Button>
            <Button variant="outline" onClick={handleRevertToDraft} disabled={isPending}>
              Revert to Draft
            </Button>
            <Button variant="outline" onClick={handleCancel} disabled={isPending} className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20">
              Cancel Invoice
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
