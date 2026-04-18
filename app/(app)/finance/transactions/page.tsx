import Link from 'next/link';
import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';

import { authOptions } from '@/lib/auth/auth';
import { cn } from '@/lib/utils';
import { getAccounts } from '@/lib/services/finance/account.service';
import { getCategories } from '@/lib/services/finance/category.service';
import { getTransactions, generateDueRecurrences } from '@/lib/services/finance/transaction.service';
import { fromMinorUnit } from '@/lib/utils/money';
import { TransactionFilters } from './_components/TransactionFilters';
import { DeleteTransactionButton } from './_components/DeleteTransactionButton';

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

const FREQ_LABELS: Record<string, string> = {
  WEEKLY: 'Weekly',
  FORTNIGHTLY: 'Fortnightly',
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  ANNUALLY: 'Annually',
};

const TYPE_LABELS: Record<string, string> = {
  INCOME: 'Income',
  EXPENSE: 'Expense',
  TRANSFER_OUT: 'Transfer Out',
  TRANSFER_IN: 'Transfer In',
};

const TYPE_BADGE_CLS: Record<string, string> = {
  INCOME: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  EXPENSE: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  TRANSFER_OUT: 'bg-accent text-muted-foreground',
  TRANSFER_IN: 'bg-accent text-muted-foreground',
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

  // Generate any past-due recurring instances before fetching
  await generateDueRecurrences(userId);

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
        <Link
          href="/finance/transactions/new"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
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
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <p className="text-sm text-muted-foreground">
            No transactions found.
          </p>
          <Link
            href="/finance/transactions/new"
            className="mt-3 inline-block text-sm font-medium text-primary underline underline-offset-2 hover:text-primary"
          >
            Add your first transaction
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
                <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground md:table-cell">
                  Account
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Amount
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {transactions.map((tx) => {
                const isIncome =
                  tx.type === 'INCOME' || tx.type === 'TRANSFER_IN';
                const badgeCls =
                  TYPE_BADGE_CLS[tx.type] ?? TYPE_BADGE_CLS.EXPENSE;

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
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span>
                          {tx.description ?? (
                            <span className="italic text-foreground">—</span>
                          )}
                        </span>
                        {tx.isRecurring && tx.recurFrequency && (
                          <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                            ↻ {FREQ_LABELS[tx.recurFrequency] ?? tx.recurFrequency}
                          </span>
                        )}
                        {!tx.isRecurring && tx.recurringId && (
                          <span className="inline-flex items-center rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-foreground">
                            Series
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="hidden whitespace-nowrap px-4 py-3 sm:table-cell">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-foreground">
                          {tx.category.name}
                        </span>
                        <span
                          className={cn('inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold', badgeCls)}
                        >
                          {TYPE_LABELS[tx.type] ?? tx.type}
                        </span>
                      </div>
                    </td>
                    <td className="hidden whitespace-nowrap px-4 py-3 text-sm text-muted-foreground md:table-cell">
                      {tx.account.name}
                    </td>
                    <td
                      className={cn(
                        'whitespace-nowrap px-4 py-3 text-right text-sm font-semibold',
                        isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
                      )}
                    >
                      {isIncome ? '+' : '-'}
                      {fromMinorUnit(tx.amount, currency)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                      <span className="inline-flex items-center gap-3">
                        <Link
                          href={`/finance/transactions/${tx.id}/edit`}
                          className="text-primary underline underline-offset-2 hover:text-primary"
                        >
                          Edit
                        </Link>
                        <DeleteTransactionButton id={tx.id} />
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
