import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';

import { authOptions } from '@/lib/auth/auth';
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
  DRAFT: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
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
      <nav className="mb-4 flex items-center gap-1.5 text-sm text-zinc-400 dark:text-zinc-500">
        <Link href="/finance" className="hover:text-zinc-600 dark:hover:text-zinc-300">
          Finance
        </Link>
        <span>/</span>
        <Link href="/finance/clients" className="hover:text-zinc-600 dark:hover:text-zinc-300">
          Clients
        </Link>
        <span>/</span>
        <span className="text-zinc-600 dark:text-zinc-300">{client.name}</span>
      </nav>

      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{client.name}</h1>
        <div className="flex items-center gap-2">
          <Link
            href={`/finance/clients/${client.id}/edit`}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Edit
          </Link>
          <ArchiveClientButton clientId={client.id} clientName={client.name} />
        </div>
      </div>

      {/* Client detail card */}
      <div className="mb-8 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {client.email && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Email
              </dt>
              <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
                <a
                  href={`mailto:${client.email}`}
                  className="text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
                >
                  {client.email}
                </a>
              </dd>
            </div>
          )}

          {client.phone && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Phone
              </dt>
              <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">{client.phone}</dd>
            </div>
          )}

          {client.defaultRate != null && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Default Hourly Rate
              </dt>
              <dd className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {fromMinorUnit(client.defaultRate, client.currency)}/hr
              </dd>
            </div>
          )}

          {client.address && (
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Address
              </dt>
              <dd className="mt-1 whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
                {client.address}
              </dd>
            </div>
          )}

          {client.notes && (
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Notes
              </dt>
              <dd className="mt-1 whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
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
            className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500"
          >
            Invoices
          </h2>
        </div>

        {client.invoices.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No invoices for this client yet.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    Invoice #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    Status
                  </th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 sm:table-cell">
                    Issue Date
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {client.invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td className="px-4 py-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {invoice.invoiceNumber}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                          INVOICE_STATUS_COLOURS[invoice.status] ?? ''
                        }`}
                      >
                        {INVOICE_STATUS_LABELS[invoice.status] ?? invoice.status}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400 sm:table-cell">
                      {new Date(invoice.issueDate).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-zinc-900 dark:text-zinc-100">
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
