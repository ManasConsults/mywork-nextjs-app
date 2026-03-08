import Link from 'next/link';
import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';

import { authOptions } from '@/lib/auth/auth';
import { getAccounts } from '@/lib/services/finance/account.service';
import { getCategories } from '@/lib/services/finance/category.service';
import { getTransactions } from '@/lib/services/finance/transaction.service';
import { fromMinorUnit } from '@/lib/utils/money';
import { TransactionFilters } from './_components/TransactionFilters';

export const metadata: Metadata = { title: 'MyWork — Transactions' };

interface TransactionsPageProps {
  searchParams: Promise<{
    accountId?: string;
    categoryId?: string;
    type?: string;
    from?: string;
    to?: string;
  }>;
}

const TYPE_LABELS: Record<string, string> = {
  INCOME: 'Income',
  EXPENSE: 'Expense',
  TRANSFER_OUT: 'Transfer Out',
  TRANSFER_IN: 'Transfer In',
};

const TYPE_BADGE_CLS: Record<string, string> = {
  INCOME: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  EXPENSE: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  TRANSFER_OUT: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  TRANSFER_IN: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
};

const VALID_TYPES = ['INCOME', 'EXPENSE', 'TRANSFER_OUT', 'TRANSFER_IN'] as const;
type TransactionType = (typeof VALID_TYPES)[number];

function isValidType(value: string): value is TransactionType {
  return (VALID_TYPES as readonly string[]).includes(value);
}

export default async function TransactionsPage({
  searchParams,
}: TransactionsPageProps): Promise<React.JSX.Element> {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;
  const currency = (session!.user.currency as string) ?? 'GBP';

  const { accountId, categoryId, type, from, to } = await searchParams;

  const filters = {
    ...(accountId ? { accountId } : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(type && isValidType(type) ? { type } : {}),
    ...(from ? { from: new Date(from) } : {}),
    ...(to ? { to: new Date(to) } : {}),
  };

  const [accounts, categories, transactions] = await Promise.all([
    getAccounts(userId),
    getCategories(userId),
    getTransactions(userId, filters),
  ]);

  const accountOptions = accounts.map((a) => ({ id: a.id, name: a.name }));
  const categoryOptions = categories.map((c) => ({
    id: c.id,
    name: c.name,
    type: c.type,
  }));

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Transactions
        </h1>
        <Link
          href="/finance/transactions/new"
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 transition-colors"
        >
          New Transaction
        </Link>
      </div>

      {/* Filters */}
      <Suspense>
        <TransactionFilters
          accounts={accountOptions}
          categories={categoryOptions}
          currentAccountId={accountId}
          currentCategoryId={categoryId}
          currentType={type}
          currentFrom={from}
          currentTo={to}
        />
      </Suspense>

      {/* Transaction table */}
      {transactions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 bg-white p-10 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No transactions found.
          </p>
          <Link
            href="/finance/transactions/new"
            className="mt-3 inline-block text-sm font-medium text-teal-600 underline underline-offset-2 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
          >
            Add your first transaction
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
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {transactions.map((tx) => {
                const isIncome =
                  tx.type === 'INCOME' || tx.type === 'TRANSFER_IN';
                const badgeCls =
                  TYPE_BADGE_CLS[tx.type] ?? TYPE_BADGE_CLS.EXPENSE;

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
                        <span className="italic text-zinc-400 dark:text-zinc-600">
                          —
                        </span>
                      )}
                    </td>
                    <td className="hidden whitespace-nowrap px-4 py-3 sm:table-cell">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-zinc-700 dark:text-zinc-300">
                          {tx.category.name}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${badgeCls}`}
                        >
                          {TYPE_LABELS[tx.type] ?? tx.type}
                        </span>
                      </div>
                    </td>
                    <td className="hidden whitespace-nowrap px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400 md:table-cell">
                      {tx.account.name}
                    </td>
                    <td
                      className={`whitespace-nowrap px-4 py-3 text-right text-sm font-semibold ${
                        isIncome
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {isIncome ? '+' : '-'}
                      {fromMinorUnit(tx.amount, currency)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                      <Link
                        href={`/finance/transactions/${tx.id}/edit`}
                        className="text-teal-600 underline underline-offset-2 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
                      >
                        Edit
                      </Link>
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
