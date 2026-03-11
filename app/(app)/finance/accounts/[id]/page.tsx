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
      <nav className="mb-4 flex items-center gap-1.5 text-sm text-zinc-400 dark:text-zinc-500">
        <Link href="/finance" className="hover:text-zinc-600 dark:hover:text-zinc-300">
          Finance
        </Link>
        <span>/</span>
        <Link href="/finance/accounts" className="hover:text-zinc-600 dark:hover:text-zinc-300">
          Accounts
        </Link>
        <span>/</span>
        <span className="text-zinc-600 dark:text-zinc-300">{account.name}</span>
      </nav>

      {/* Account header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50 mb-6">
            {account.name}
          </h1>
        </div>
        <ArchiveAccountButton accountId={account.id} accountName={account.name} />
      </div>

      {/* Account detail card */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 mb-8">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Type
            </dt>
            <dd className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {ACCOUNT_TYPE_LABELS[account.type] ?? account.type}
            </dd>
          </div>

          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Current Balance
            </dt>
            <dd className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              {fromMinorUnit(balance, currency)}
            </dd>
          </div>

          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Opening Balance
            </dt>
            <dd className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {fromMinorUnit(account.openingBalance, currency)}
            </dd>
          </div>

          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Default Account
            </dt>
            <dd className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {account.isDefault ? (
                <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-semibold text-teal-700 dark:bg-teal-900/40 dark:text-teal-400">
                  Yes
                </span>
              ) : (
                <span className="text-zinc-400 dark:text-zinc-500">No</span>
              )}
            </dd>
          </div>

          {account.description && (
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Description
              </dt>
              <dd className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
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
            className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500"
          >
            Recent Transactions
          </h2>
          <Link
            href={`/finance/transactions?accountId=${account.id}`}
            className="text-xs font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
          >
            View all
          </Link>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No transactions recorded for this account yet.
            </p>
            <Link
              href="/finance/transactions/new"
              className="mt-3 inline-block rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 transition-colors"
            >
              Add transaction
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    Description
                  </th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 sm:table-cell">
                    Category
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {recentTransactions.map((tx) => {
                  const isIncome =
                    tx.type === 'INCOME' || tx.type === 'TRANSFER_IN';
                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
                        {new Date(tx.date).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100">
                        {tx.description ?? (
                          <span className="italic text-zinc-400">—</span>
                        )}
                      </td>
                      <td className="hidden whitespace-nowrap px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400 sm:table-cell">
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
