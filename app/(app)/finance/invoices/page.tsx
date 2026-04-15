import Link from 'next/link';
import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';

import { authOptions } from '@/lib/auth/auth';
import { getInvoices, resolveInvoiceStatus } from '@/lib/services/finance/invoice.service';
import { fromMinorUnit } from '@/lib/utils/money';
import type { InvoiceStatus } from '@prisma/client';
import { DeleteInvoiceButton } from './_components/DeleteInvoiceButton';

export const metadata: Metadata = { title: 'MyWork — Invoices' };

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

const FILTER_TABS: { label: string; value: string | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Sent', value: 'SENT' },
  { label: 'Overdue', value: 'OVERDUE' },
  { label: 'Paid', value: 'PAID' },
];

function formatDate(date: Date | null | undefined): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

interface InvoicesPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function InvoicesPage({
  searchParams,
}: InvoicesPageProps): Promise<React.JSX.Element> {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;
  const { status: statusParam } = await searchParams;

  // OVERDUE is derived — we fetch SENT invoices and filter client-side when "OVERDUE" tab selected
  const isOverdueFilter = statusParam === 'OVERDUE';
  const dbStatus = isOverdueFilter
    ? 'SENT'
    : (statusParam as InvoiceStatus | undefined);

  const invoices = await getInvoices(userId, dbStatus ? { status: dbStatus } : undefined);

  // For OVERDUE filter, apply derived status filter
  const filteredInvoices = isOverdueFilter
    ? invoices.filter((inv) => resolveInvoiceStatus(inv) === 'OVERDUE')
    : invoices;

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/finance/invoices/new"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
        >
          + New Invoice
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="mb-6 flex gap-1 border-b border-border">
        {FILTER_TABS.map((tab) => {
          const isActive = (statusParam ?? undefined) === tab.value;
          const href = tab.value ? `/finance/invoices?status=${tab.value}` : '/finance/invoices';
          return (
            <Link
              key={tab.label}
              href={href}
              className={[
                'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              ].join(' ')}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Invoice table */}
      {filteredInvoices.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No invoices found.{' '}
            <Link href="/finance/invoices/new" className="text-primary hover:underline">
              Create your first invoice.
            </Link>
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Invoice #
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Client
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Issue Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Due Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Total
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredInvoices.map((invoice) => {
                const resolved = resolveInvoiceStatus(invoice);
                return (
                  <tr
                    key={invoice.id}
                    className="transition-colors hover:bg-accent/40"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">
                      {invoice.invoiceNumber}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {invoice.client.name}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(invoice.issueDate)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(invoice.dueDate)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={[
                          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
                          STATUS_BADGE_CLS[resolved] ?? STATUS_BADGE_CLS['DRAFT'],
                        ].join(' ')}
                      >
                        {STATUS_LABELS[resolved] ?? resolved}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-foreground">
                      {fromMinorUnit(invoice.total, invoice.currency)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center justify-end gap-2">
                        <Link
                          href={`/finance/invoices/${invoice.id}`}
                          className="rounded-lg border border-border px-3 py-1 text-xs text-zinc-600 transition-colors hover:bg-accent/40 dark:text-zinc-400"
                        >
                          View
                        </Link>
                        {resolved === 'CANCELLED' && (
                          <DeleteInvoiceButton id={invoice.id} />
                        )}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
