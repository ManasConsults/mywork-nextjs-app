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
  DRAFT: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
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
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          Invoices
        </Link>
        <span className="text-zinc-300 dark:text-zinc-700">/</span>
        <span className="text-sm text-zinc-900 dark:text-zinc-50">{invoice.invoiceNumber}</span>
      </div>

      {/* Invoice header */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
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
            <p className="text-lg font-medium text-zinc-700 dark:text-zinc-300">
              {invoice.client.name}
            </p>
            {invoice.client.email && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{invoice.client.email}</p>
            )}
          </div>

          <div className="flex flex-col items-end gap-3">
            {/* PDF download — always available */}
            <Link
              href={`/api/finance/invoices/${invoice.id}/pdf`}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm4.75 6.75a.75.75 0 011.5 0v2.546l.943-1.048a.75.75 0 111.114 1.004l-2.25 2.5a.75.75 0 01-1.114 0l-2.25-2.5a.75.75 0 111.114-1.004l.943 1.048V8.75z" clipRule="evenodd" />
              </svg>
              Export PDF
            </Link>

            <div className="text-sm text-zinc-600 dark:text-zinc-400 text-right space-y-1">
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
          <div className="mt-4 rounded-lg bg-zinc-50 px-4 py-3 text-sm text-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-300">
            {invoice.notes}
          </div>
        )}
      </div>

      {/* Line items table */}
      <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Line Items</h2>
        </div>

        {invoice.lineItems.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
            No line items yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Description
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Qty
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Unit Price
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {invoice.lineItems.map((li) => (
                  <tr key={li.id}>
                    <td className="px-6 py-3 text-zinc-900 dark:text-zinc-50">{li.description}</td>
                    <td className="px-4 py-3 text-right text-zinc-600 dark:text-zinc-400">
                      {Number(li.quantity).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-600 dark:text-zinc-400">
                      {fromMinorUnit(li.unitPrice, invoice.currency)}
                    </td>
                    <td className="px-6 py-3 text-right font-medium text-zinc-900 dark:text-zinc-50">
                      {fromMinorUnit(li.total, invoice.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Totals */}
        <div className="border-t border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <div className="ml-auto max-w-xs space-y-2 text-sm">
            <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
              <span>Subtotal</span>
              <span>{fromMinorUnit(invoice.subtotal, invoice.currency)}</span>
            </div>
            {invoice.taxRate > 0 && (
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <span>Tax ({taxRatePercent}%)</span>
                <span>{fromMinorUnit(invoice.taxAmount, invoice.currency)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-zinc-200 pt-2 text-base font-semibold text-zinc-900 dark:border-zinc-700 dark:text-zinc-50">
              <span>Total</span>
              <span>{fromMinorUnit(invoice.total, invoice.currency)}</span>
            </div>
          </div>
          {isDraft && invoice.lineItems.length > 0 && (
            <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
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
              <dt className="w-36 shrink-0 text-zinc-500 dark:text-zinc-400">Account name</dt>
              <dd className="font-medium text-zinc-900 dark:text-zinc-50">{invoice.paymentAccount.name}</dd>
            </div>
            {invoice.paymentAccount.bankName && (
              <div className="flex gap-4">
                <dt className="w-36 shrink-0 text-zinc-500 dark:text-zinc-400">Bank</dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-50">{invoice.paymentAccount.bankName}</dd>
              </div>
            )}
            {invoice.paymentAccount.bsb && (
              <div className="flex gap-4">
                <dt className="w-36 shrink-0 text-zinc-500 dark:text-zinc-400">BSB</dt>
                <dd className="font-mono font-medium text-zinc-900 dark:text-zinc-50">{invoice.paymentAccount.bsb}</dd>
              </div>
            )}
            {invoice.paymentAccount.accountNumber && (
              <div className="flex gap-4">
                <dt className="w-36 shrink-0 text-zinc-500 dark:text-zinc-400">Account number</dt>
                <dd className="font-mono font-medium text-zinc-900 dark:text-zinc-50">{invoice.paymentAccount.accountNumber}</dd>
              </div>
            )}
            {invoice.paymentAccount.iban && (
              <div className="flex gap-4">
                <dt className="w-36 shrink-0 text-zinc-500 dark:text-zinc-400">IBAN</dt>
                <dd className="font-mono font-medium text-zinc-900 dark:text-zinc-50">{invoice.paymentAccount.iban}</dd>
              </div>
            )}
            {invoice.paymentAccount.swiftBic && (
              <div className="flex gap-4">
                <dt className="w-36 shrink-0 text-zinc-500 dark:text-zinc-400">SWIFT / BIC</dt>
                <dd className="font-mono font-medium text-zinc-900 dark:text-zinc-50">{invoice.paymentAccount.swiftBic}</dd>
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
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">
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
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">Actions</h2>
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
