import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';

import { authOptions } from '@/lib/auth/auth';
import { getAccountById, getAccountBalance } from '@/lib/services/finance/account.service';
import { getTransactions } from '@/lib/services/finance/transaction.service';
import { fromMinorUnit } from '@/lib/utils/money';
import { ArchiveAccountButton } from '../_components/ArchiveAccountButton';

export const metadata: Metadata = { title: 'MyWork — Account Detail' };

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  CHECKING: 'Checking',
  SAVINGS: 'Savings',
  CASH: 'Cash',
  CREDIT: 'Credit',
  INVESTMENT: 'Investment',
};

interface AccountDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AccountDetailPage({
  params,
}: AccountDetailPageProps): Promise<React.JSX.Element> {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;
  const currency = (session!.user.currency as string) ?? 'GBP';

  const { id } = await params;

  const [account, balance, allTransactions] = await Promise.all([
    getAccountById(userId, id),
    getAccountBalance(userId, id),
    getTransactions(userId, { accountId: id }),
  ]);

  if (!account) notFound();

  const recentTransactions = allTransactions.slice(0, 10);

  return (
    <div className="mx-auto max-w-3xl">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/finance" className="hover:text-foreground">
          Finance
        </Link>
        <span>/</span>
        <Link href="/finance/accounts" className="hover:text-foreground">
          Accounts
        </Link>
        <span>/</span>
        <span className="text-muted-foreground">{account.name}</span>
      </nav>

      {/* Account header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <ArchiveAccountButton accountId={account.id} accountName={account.name} />
      </div>

      {/* Account detail card */}
      <div className="rounded-xl border border-border bg-card p-6 mb-8">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Type
            </dt>
            <dd className="mt-1 text-sm font-medium text-foreground">
              {ACCOUNT_TYPE_LABELS[account.type] ?? account.type}
            </dd>
          </div>

          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Current Balance
            </dt>
            <dd className="mt-1 text-2xl font-semibold text-foreground">
              {fromMinorUnit(balance, currency)}
            </dd>
          </div>

          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Opening Balance
            </dt>
            <dd className="mt-1 text-sm font-medium text-foreground">
              {fromMinorUnit(account.openingBalance, currency)}
            </dd>
          </div>

          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Default Account
            </dt>
            <dd className="mt-1 text-sm font-medium text-foreground">
              {account.isDefault ? (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                  Yes
                </span>
              ) : (
                <span className="text-muted-foreground">No</span>
              )}
            </dd>
          </div>

          {account.description && (
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Description
              </dt>
              <dd className="mt-1 text-sm text-foreground">
                {account.description}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* Recent Transactions */}
      <section aria-labelledby="account-txns-heading">
        <div className="mb-3 flex items-center justify-between">
          <h2
            id="account-txns-heading"
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Recent Transactions
          </h2>
          <Link
            href={`/finance/transactions?accountId=${account.id}`}
            className="text-xs font-medium text-primary hover:text-primary"
          >
            View all
          </Link>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground">
              No transactions recorded for this account yet.
            </p>
            <Link
              href="/finance/transactions/new"
              className="mt-3 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
            >
              Add transaction
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <table className="min-w-full divide-y divide-border">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Description
                  </th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:table-cell">
                    Category
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {recentTransactions.map((tx) => {
                  const isIncome =
                    tx.type === 'INCOME' || tx.type === 'TRANSFER_IN';
                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-accent/40"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                        {new Date(tx.date).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        {tx.description ?? (
                          <span className="italic text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="hidden whitespace-nowrap px-4 py-3 text-sm text-muted-foreground sm:table-cell">
                        {tx.category.name}
                      </td>
                      <td
                        className={`whitespace-nowrap px-4 py-3 text-right text-sm font-medium ${
                          isIncome
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {isIncome ? '+' : '-'}
                        {fromMinorUnit(tx.amount, currency)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
