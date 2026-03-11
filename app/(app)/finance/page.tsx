import Link from 'next/link';
import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';

import { authOptions } from '@/lib/auth/auth';
import { getAccounts, getAccountBalance } from '@/lib/services/finance/account.service';
import { getTransactions, getTransactionSummary, generateDueRecurrences } from '@/lib/services/finance/transaction.service';
import { fromMinorUnit } from '@/lib/utils/money';

export const metadata: Metadata = { title: 'MyWork — Finance' };

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  CHECKING: 'Checking',
  SAVINGS: 'Savings',
  CASH: 'Cash',
  CREDIT: 'Credit',
  INVESTMENT: 'Investment',
};

export default async function FinancePage(): Promise<React.JSX.Element> {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;
  const currency = (session!.user.currency as string) ?? 'GBP';

  // Trigger recurring transaction generation (idempotent, SAD-002 §6.6)
  await generateDueRecurrences(userId);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const [accounts, recentTransactions, summary] = await Promise.all([
    getAccounts(userId),
    getTransactions(userId, { from: undefined, to: undefined }),
    getTransactionSummary(userId, monthStart, monthEnd),
  ]);

  const accountsWithBalances = await Promise.all(
    accounts.map(async (acc) => ({
      ...acc,
      balance: await getAccountBalance(userId, acc.id),
    })),
  );

  const last5 = recentTransactions.slice(0, 5);

  const isPositive = summary.net >= 0;

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Finance</h1>
        <Link
          href="/finance/transactions/new"
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 transition-colors"
        >
          New Transaction
        </Link>
      </div>

      {/* Summary cards — current month */}
      <section aria-labelledby="summary-heading" className="mb-8">
        <h2
          id="summary-heading"
          className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500"
        >
          This month
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SummaryCard
            label="Total Income"
            value={fromMinorUnit(summary.totalIncome, currency)}
            accent="green"
          />
          <SummaryCard
            label="Total Expenses"
            value={fromMinorUnit(summary.totalExpenses, currency)}
            accent="red"
          />
          <SummaryCard
            label="Net"
            value={fromMinorUnit(Math.abs(summary.net), currency)}
            prefix={isPositive ? '+' : '-'}
            accent={isPositive ? 'green' : 'red'}
          />
        </div>
      </section>

      {/* Accounts section */}
      <section aria-labelledby="accounts-heading" className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2
            id="accounts-heading"
            className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500"
          >
            Accounts
          </h2>
          <Link
            href="/finance/accounts"
            className="text-xs font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
          >
            View all
          </Link>
        </div>

        {accountsWithBalances.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No accounts yet.</p>
            <Link
              href="/finance/accounts/new"
              className="mt-3 inline-block rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 transition-colors"
            >
              Add account
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {accountsWithBalances.map((acc) => (
              <Link
                key={acc.id}
                href={`/finance/accounts/${acc.id}`}
                className="rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:border-teal-300 hover:bg-teal-50/30 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-teal-700 dark:hover:bg-teal-900/10"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{acc.name}</p>
                    <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
                      {ACCOUNT_TYPE_LABELS[acc.type] ?? acc.type}
                      {acc.isDefault && (
                        <span className="ml-2 rounded-full bg-teal-100 px-1.5 py-0.5 text-[10px] font-medium text-teal-700 dark:bg-teal-900/40 dark:text-teal-400">
                          Default
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  {fromMinorUnit(acc.balance, currency)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Recent Transactions */}
      <section aria-labelledby="transactions-heading">
        <div className="mb-3 flex items-center justify-between">
          <h2
            id="transactions-heading"
            className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500"
          >
            Recent Transactions
          </h2>
          <Link
            href="/finance/transactions"
            className="text-xs font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
          >
            View all
          </Link>
        </div>

        {last5.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No transactions recorded yet.</p>
            <Link
              href="/finance/transactions/new"
              className="mt-3 inline-block rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 transition-colors"
            >
              Add first transaction
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
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 md:table-cell">
                    Account
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {last5.map((tx) => {
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
                        {tx.description ?? <span className="italic text-zinc-400">—</span>}
                      </td>
                      <td className="hidden whitespace-nowrap px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400 sm:table-cell">
                        {tx.category.name}
                      </td>
                      <td className="hidden whitespace-nowrap px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400 md:table-cell">
                        {tx.account.name}
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

function SummaryCard({
  label,
  value,
  prefix,
  accent,
}: {
  label: string;
  value: string;
  prefix?: string;
  accent: 'green' | 'red';
}): React.JSX.Element {
  const valueClass =
    accent === 'green'
      ? 'text-green-600 dark:text-green-400'
      : 'text-red-600 dark:text-red-400';

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${valueClass}`}>
        {prefix}
        {value}
      </p>
    </div>
  );
}
