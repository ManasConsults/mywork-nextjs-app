import { Suspense } from 'react';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';
import { z } from 'zod';

import { authOptions } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { cn } from '@/lib/utils';
import { getAccounts, getAccountBalance } from '@/lib/services/finance/account.service';
import { getTransactions, getTransactionSummary, generateDueRecurrences } from '@/lib/services/finance/transaction.service';
import { fromMinorUnit, DEFAULT_CURRENCY } from '@/lib/utils/money';
import { currentFiscalYear, fiscalYearLabel, getFiscalYearRange } from '@/lib/utils/fiscal-year';
import { SummaryPeriodToggle, type SummaryPeriod } from './_components/SummaryPeriodToggle';

export const metadata: Metadata = { title: 'MyWork — Finance' };

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  CHECKING: 'Checking',
  SAVINGS: 'Savings',
  CASH: 'Cash',
  CREDIT: 'Credit',
  INVESTMENT: 'Investment',
};

const periodSchema = z.enum(['day', 'month', 'fy']).catch('month');

function getPeriodRange(
  period: Exclude<SummaryPeriod, 'fy'>,
  now: Date,
): { start: Date; end: Date } {
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();
  return period === 'day'
    ? { start: new Date(y, m, d), end: new Date(y, m, d, 23, 59, 59, 999) }
    : { start: new Date(y, m, 1), end: new Date(y, m + 1, 0, 23, 59, 59, 999) };
}

interface FinancePageProps {
  searchParams: Promise<{ period?: string | string[] }>;
}

export default async function FinancePage({ searchParams }: FinancePageProps): Promise<React.JSX.Element> {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;
  const currency = (session!.user.currency as string) ?? DEFAULT_CURRENCY;

  // Trigger recurring transaction generation (idempotent, SAD-002 §6.6)
  await generateDueRecurrences(userId);

  const period = periodSchema.parse((await searchParams).period);

  let start: Date;
  let end: Date;
  let heading: string;
  if (period === 'fy') {
    // Same per-user FY setting as Achievements, so both modules agree on what "the FY" is.
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { fiscalYearStartMonth: true },
    });
    const startMonth = user?.fiscalYearStartMonth ?? 4;
    const fy = currentFiscalYear(startMonth);
    ({ from: start, to: end } = getFiscalYearRange(fy, startMonth));
    heading = `Financial year · ${fiscalYearLabel(fy, startMonth)}`;
  } else {
    ({ start, end } = getPeriodRange(period, new Date()));
    heading = period === 'day' ? 'Today' : 'This month';
  }

  const [accounts, recentTransactions, summary] = await Promise.all([
    getAccounts(userId),
    getTransactions(userId, { from: undefined, to: undefined }),
    getTransactionSummary(userId, start, end),
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
        <Link
          href="/finance/transactions/new"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
        >
          New Transaction
        </Link>
      </div>

      {/* Summary cards — selected period */}
      <section aria-labelledby="summary-heading" className="mb-8">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2
            id="summary-heading"
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            {heading}
          </h2>
          <Suspense>
            <SummaryPeriodToggle current={period} />
          </Suspense>
        </div>
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
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Accounts
          </h2>
          <Link
            href="/finance/accounts"
            className="text-xs font-medium text-primary hover:text-primary"
          >
            View all
          </Link>
        </div>

        {accountsWithBalances.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
            <p className="text-sm text-muted-foreground">No accounts yet.</p>
            <Link
              href="/finance/accounts/new"
              className="mt-3 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
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
                className="rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 dark:hover:border-primary/70"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{acc.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {ACCOUNT_TYPE_LABELS[acc.type] ?? acc.type}
                      {acc.isDefault && (
                        <span className="ml-2 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                          Default
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-lg font-semibold text-foreground">
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
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Recent Transactions
          </h2>
          <Link
            href="/finance/transactions"
            className="text-xs font-medium text-primary hover:text-primary"
          >
            View all
          </Link>
        </div>

        {last5.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
            <p className="text-sm text-muted-foreground">No transactions recorded yet.</p>
            <Link
              href="/finance/transactions/new"
              className="mt-3 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
            >
              Add first transaction
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
            <table className="min-w-full divide-y divide-border">
              <thead>
                <tr>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:table-cell">
                    Date
                  </th>
                  <th className="px-4 sm:min-w-48 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {last5.map((tx) => {
                  const isIncome =
                    tx.type === 'INCOME' || tx.type === 'TRANSFER_IN';
                  const dateLabel = new Date(tx.date).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  });
                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-accent/40"
                    >
                      <td className="hidden whitespace-nowrap px-4 py-3 text-sm text-muted-foreground sm:table-cell">
                        {dateLabel}
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        {tx.description ?? <span className="italic text-muted-foreground">—</span>}
                        <span className="mt-0.5 block text-xs text-muted-foreground sm:hidden">{dateLabel}</span>
                      </td>
                      <td className="hidden whitespace-nowrap px-4 py-3 text-sm text-muted-foreground sm:table-cell">
                        {tx.category.name}
                      </td>
                      <td className="hidden whitespace-nowrap px-4 py-3 text-sm text-muted-foreground md:table-cell">
                        {tx.account.name}
                      </td>
                      <td
                        className={cn(
                          'whitespace-nowrap px-4 py-3 text-right text-sm font-medium',
                          isIncome ? 'text-success' : 'text-destructive',
                        )}
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
  const styles = accent === 'green'
    ? { ring: 'border-success/25', value: 'text-success' }
    : { ring: 'border-destructive/25', value: 'text-destructive' };

  return (
    <div className={cn('rounded-xl border bg-card p-5 transition-all duration-200 hover:-translate-y-0.5', styles.ring)}>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn('mt-3 text-3xl font-bold tracking-tight', styles.value)}>
        {prefix}
        {value}
      </p>
    </div>
  );
}
