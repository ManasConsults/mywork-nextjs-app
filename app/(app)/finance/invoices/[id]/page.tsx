import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';

import { authOptions } from '@/lib/auth/auth';
import {
  getInvoiceById,
  resolveInvoiceStatus,
} from '@/lib/services/finance/invoice.service';
import { prisma } from '@/lib/db/prisma';
import { fromMinorUnit } from '@/lib/utils/money';
import { InvoiceActions } from '../_components/InvoiceActions';
import { AddLineItemForm } from '../_components/AddLineItemForm';
import { AddFromWorkLogsForm } from '../_components/AddFromWorkLogsForm';

export const metadata: Metadata = { title: 'MyWork — Invoice Detail' };

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  SENT: 'Sent',
  OVERDUE: 'Overdue',
  PAID: 'Paid',
  CANCELLED: 'Cancelled',
};

const STATUS_BADGE_CLS: Record<string, string> = {
  DRAFT: 'bg-accent text-muted-foreground',
  SENT: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  OVERDUE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  PAID: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

function formatDate(date: Date | null | undefined): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

interface InvoiceDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function InvoiceDetailPage({
  params,
}: InvoiceDetailPageProps): Promise<React.JSX.Element> {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;
  const { id } = await params;

  const invoice = await getInvoiceById(userId, id);
  if (!invoice) notFound();

  const resolved = resolveInvoiceStatus(invoice);
  const isDraft = invoice.status === 'DRAFT';
  const taxRatePercent = invoice.taxRate / 100; // e.g. 2000 → 20

  // Fetch unbilled work logs for this invoice's client (DRAFT only) — AC-FIN-10-1
  const unbilledWorkLogs = isDraft
    ? await prisma.workLog.findMany({
        where: { userId, clientId: invoice.clientId, billable: true, billedAt: null },
        select: { id: true, description: true, timeSpent: true, date: true },
        orderBy: { date: 'desc' },
      })
    : [];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3">
        <Link
          href="/finance/invoices"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Invoices
        </Link>
        <span className="text-foreground">/</span>
        <span className="text-sm text-foreground">{invoice.invoiceNumber}</span>
      </div>

      {/* Invoice header */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-foreground">
                {invoice.invoiceNumber}
              </h1>
              <span
                className={[
                  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
                  STATUS_BADGE_CLS[resolved] ?? STATUS_BADGE_CLS['DRAFT'],
                ].join(' ')}
              >
                {STATUS_LABELS[resolved] ?? resolved}
              </span>
            </div>
            <p className="text-lg font-medium text-foreground">
              {invoice.client.name}
            </p>
            {invoice.client.email && (
              <p className="text-sm text-muted-foreground">{invoice.client.email}</p>
            )}
          </div>

          <div className="flex flex-col items-end gap-3">
            {/* PDF download — always available */}
            <Link
              href={`/api/finance/invoices/${invoice.id}/pdf`}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm4.75 6.75a.75.75 0 011.5 0v2.546l.943-1.048a.75.75 0 111.114 1.004l-2.25 2.5a.75.75 0 01-1.114 0l-2.25-2.5a.75.75 0 111.114-1.004l.943 1.048V8.75z" clipRule="evenodd" />
              </svg>
              Export PDF
            </Link>

            <div className="text-sm text-muted-foreground text-right space-y-1">
            <p>
              <span className="font-medium">Issue date:</span> {formatDate(invoice.issueDate)}
            </p>
            <p>
              <span className="font-medium">Due date:</span> {formatDate(invoice.dueDate)}
            </p>
            {invoice.sentAt && (
              <p>
                <span className="font-medium">Sent:</span> {formatDate(invoice.sentAt)}
              </p>
            )}
            {invoice.paidAt && (
              <p>
                <span className="font-medium">Paid:</span> {formatDate(invoice.paidAt)}
              </p>
            )}
            </div>
          </div>
        </div>

        {invoice.notes && (
          <div className="mt-4 rounded-lg bg-accent/40 px-4 py-3 text-sm text-muted-foreground">
            {invoice.notes}
          </div>
        )}
      </div>

      {/* Line items table */}
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold text-foreground">Line Items</h2>
        </div>

        {invoice.lineItems.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-muted-foreground">
            No line items yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Description
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Qty
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Unit Price
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {invoice.lineItems.map((li) => (
                  <tr key={li.id}>
                    <td className="px-6 py-3 text-foreground">{li.description}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {Number(li.quantity).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {fromMinorUnit(li.unitPrice, invoice.currency)}
                    </td>
                    <td className="px-6 py-3 text-right font-medium text-foreground">
                      {fromMinorUnit(li.total, invoice.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Totals */}
        <div className="border-t border-border px-6 py-4">
          <div className="ml-auto max-w-xs space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{fromMinorUnit(invoice.subtotal, invoice.currency)}</span>
            </div>
            {invoice.taxRate > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Tax ({taxRatePercent}%)</span>
                <span>{fromMinorUnit(invoice.taxAmount, invoice.currency)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-border pt-2 text-base font-semibold text-foreground">
              <span>Total</span>
              <span>{fromMinorUnit(invoice.total, invoice.currency)}</span>
            </div>
          </div>
          {isDraft && invoice.lineItems.length > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              Totals are calculated and frozen when the invoice is sent.
            </p>
          )}
        </div>
      </div>

      {/* Payment details */}
      {invoice.paymentAccount && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-6 dark:border-green-900/40 dark:bg-green-950/20">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-green-800 dark:text-green-400">
            Payment Details
          </h2>
          <dl className="space-y-1.5 text-sm">
            <div className="flex gap-4">
              <dt className="w-36 shrink-0 text-muted-foreground">Account name</dt>
              <dd className="font-medium text-foreground">{invoice.paymentAccount.name}</dd>
            </div>
            {invoice.paymentAccount.bankName && (
              <div className="flex gap-4">
                <dt className="w-36 shrink-0 text-muted-foreground">Bank</dt>
                <dd className="font-medium text-foreground">{invoice.paymentAccount.bankName}</dd>
              </div>
            )}
            {invoice.paymentAccount.bsb && (
              <div className="flex gap-4">
                <dt className="w-36 shrink-0 text-muted-foreground">BSB</dt>
                <dd className="font-mono font-medium text-foreground">{invoice.paymentAccount.bsb}</dd>
              </div>
            )}
            {invoice.paymentAccount.accountNumber && (
              <div className="flex gap-4">
                <dt className="w-36 shrink-0 text-muted-foreground">Account number</dt>
                <dd className="font-mono font-medium text-foreground">{invoice.paymentAccount.accountNumber}</dd>
              </div>
            )}
            {invoice.paymentAccount.iban && (
              <div className="flex gap-4">
                <dt className="w-36 shrink-0 text-muted-foreground">IBAN</dt>
                <dd className="font-mono font-medium text-foreground">{invoice.paymentAccount.iban}</dd>
              </div>
            )}
            {invoice.paymentAccount.swiftBic && (
              <div className="flex gap-4">
                <dt className="w-36 shrink-0 text-muted-foreground">SWIFT / BIC</dt>
                <dd className="font-mono font-medium text-foreground">{invoice.paymentAccount.swiftBic}</dd>
              </div>
            )}
          </dl>
          <p className="mt-4 text-xs text-green-700 dark:text-green-500">
            Please use <span className="font-semibold">{invoice.invoiceNumber}</span> as the payment reference.
          </p>
        </div>
      )}

      {/* Add Line Item (DRAFT only) */}
      {isDraft && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-base font-semibold text-foreground">
            Add Line Item
          </h2>
          <AddLineItemForm invoiceId={invoice.id} />
          <AddFromWorkLogsForm
            invoiceId={invoice.id}
            workLogs={unbilledWorkLogs}
            defaultRate={invoice.client.defaultRate}
          />
        </div>
      )}

      {/* Actions */}
      {(invoice.status === 'DRAFT' || invoice.status === 'SENT') && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-base font-semibold text-foreground">Actions</h2>
          <InvoiceActions
            invoiceId={invoice.id}
            status={resolved}
            reminderCount={invoice.reminderCount}
            lastReminderAt={invoice.lastReminderAt}
          />
        </div>
      )}
    </div>
  );
}
