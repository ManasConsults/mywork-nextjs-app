import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';

import { authOptions } from '@/lib/auth/auth';
import { cn } from '@/lib/utils';
import { getClientById } from '@/lib/services/finance/client.service';
import { fromMinorUnit } from '@/lib/utils/money';
import { ArchiveClientButton } from '../_components/ArchiveClientButton';

export const metadata: Metadata = { title: 'MyWork — Client Detail' };

const INVOICE_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  SENT: 'Sent',
  PAID: 'Paid',
  CANCELLED: 'Cancelled',
};

const INVOICE_STATUS_COLOURS: Record<string, string> = {
  DRAFT: 'bg-accent text-muted-foreground',
  SENT: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  PAID: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

interface ClientDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientDetailPage({
  params,
}: ClientDetailPageProps): Promise<React.JSX.Element> {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const { id } = await params;
  const client = await getClientById(userId, id);

  if (!client) {
    redirect('/finance/clients');
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/finance" className="hover:text-foreground">
          Finance
        </Link>
        <span>/</span>
        <Link href="/finance/clients" className="hover:text-foreground">
          Clients
        </Link>
        <span>/</span>
        <span className="text-muted-foreground">{client.name}</span>
      </nav>

      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-2">
          <Link
            href={`/finance/clients/${client.id}/edit`}
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent/40"
          >
            Edit
          </Link>
          <ArchiveClientButton clientId={client.id} clientName={client.name} />
        </div>
      </div>

      {/* Client detail card */}
      <div className="mb-8 rounded-xl border border-border bg-card p-6">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {client.email && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Email
              </dt>
              <dd className="mt-1 text-sm text-foreground">
                <a
                  href={`mailto:${client.email}`}
                  className="text-primary hover:text-primary"
                >
                  {client.email}
                </a>
              </dd>
            </div>
          )}

          {client.phone && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Phone
              </dt>
              <dd className="mt-1 text-sm text-foreground">{client.phone}</dd>
            </div>
          )}

          {client.defaultRate != null && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Default Hourly Rate
              </dt>
              <dd className="mt-1 text-sm font-medium text-foreground">
                {fromMinorUnit(client.defaultRate, client.currency)}/hr
              </dd>
            </div>
          )}

          {client.address && (
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Address
              </dt>
              <dd className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                {client.address}
              </dd>
            </div>
          )}

          {client.notes && (
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Notes
              </dt>
              <dd className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                {client.notes}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* Invoices */}
      <section aria-labelledby="client-invoices-heading">
        <div className="mb-3 flex items-center justify-between">
          <h2
            id="client-invoices-heading"
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Invoices
          </h2>
        </div>

        {client.invoices.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground">
              No invoices for this client yet.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <table className="min-w-full divide-y divide-border">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Invoice #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Status
                  </th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:table-cell">
                    Issue Date
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {client.invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-accent/40">
                    <td className="px-4 py-3 text-sm font-medium text-foreground">
                      {invoice.invoiceNumber}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-semibold', INVOICE_STATUS_COLOURS[invoice.status])}
                      >
                        {INVOICE_STATUS_LABELS[invoice.status] ?? invoice.status}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-sm text-muted-foreground sm:table-cell">
                      {new Date(invoice.issueDate).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-foreground">
                      {fromMinorUnit(invoice.total, invoice.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
