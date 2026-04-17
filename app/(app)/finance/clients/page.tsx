import Link from 'next/link';
import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';

import { authOptions } from '@/lib/auth/auth';
import { getClients } from '@/lib/services/finance/client.service';
import { fromMinorUnit } from '@/lib/utils/money';
import { ArchiveClientButton } from './_components/ArchiveClientButton';

export const metadata: Metadata = { title: 'MyWork — Clients' };

export default async function ClientsPage(): Promise<React.JSX.Element> {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const clients = await getClients(userId);

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/finance/clients/new"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
        >
          + New Client
        </Link>
      </div>

      {/* Client list */}
      {clients.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No clients yet. Add your first client to start creating invoices.
          </p>
          <Link
            href="/finance/clients/new"
            className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
          >
            Add client
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="min-w-full divide-y divide-border">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Name
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:table-cell">
                  Email
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Total Invoiced
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Outstanding
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-accent/40">
                  <td className="px-4 py-3">
                    <Link
                      href={`/finance/clients/${client.id}`}
                      className="text-sm font-medium text-zinc-900 hover:text-primary"
                    >
                      {client.name}
                    </Link>
                  </td>
                  <td className="hidden px-4 py-3 text-sm text-muted-foreground sm:table-cell">
                    {client.email ?? <span className="italic text-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-foreground">
                    {fromMinorUnit(client.totalInvoiced, client.currency)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium">
                    <span
                      className={
                        client.totalOutstanding > 0
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-green-600 dark:text-green-400'
                      }
                    >
                      {fromMinorUnit(client.totalOutstanding, client.currency)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/finance/clients/${client.id}/edit`}
                        className="rounded-lg border border-border px-3 py-1.5 text-sm text-zinc-600 transition-colors hover:bg-accent/40 dark:text-zinc-400"
                      >
                        Edit
                      </Link>
                      <ArchiveClientButton clientId={client.id} clientName={client.name} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
