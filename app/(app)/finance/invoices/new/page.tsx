import Link from 'next/link';
import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';
import type { Client } from '@prisma/client';

import { authOptions } from '@/lib/auth/auth';
import { getClients } from '@/lib/services/finance/client.service';
import { getAccounts } from '@/lib/services/finance/account.service';
import { InvoiceForm } from '../_components/InvoiceForm';

export const metadata: Metadata = { title: 'MyWork — New Invoice' };

export default async function NewInvoicePage(): Promise<React.JSX.Element> {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const [rawClients, accounts] = await Promise.all([
    getClients(userId),
    getAccounts(userId),
  ]);

  // getClients returns ClientWithTotals; strip computed fields to get plain Client shape
  const clientList: Client[] = rawClients.map(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ({ totalInvoiced: _ti, totalOutstanding: _to, ...client }) => client,
  );

  // Only include accounts that have at least one payment detail set
  const paymentAccounts = accounts.map((a) => ({
    id: a.id,
    name: a.name,
    bankName: a.bankName,
    accountNumber: a.accountNumber,
    bsb: a.bsb,
    iban: a.iban,
    swiftBic: a.swiftBic,
  }));

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/finance/invoices"
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          Invoices
        </Link>
        <span className="text-zinc-300 dark:text-zinc-700">/</span>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">New Invoice</h1>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <InvoiceForm clients={clientList} paymentAccounts={paymentAccounts} />
      </div>
    </div>
  );
}
