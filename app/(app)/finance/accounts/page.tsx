import Link from 'next/link';
import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';

import { authOptions } from '@/lib/auth/auth';
import { getAccounts, getAccountBalance } from '@/lib/services/finance/account.service';
import { fromMinorUnit } from '@/lib/utils/money';
import { ArchiveAccountButton } from './_components/ArchiveAccountButton';

export const metadata: Metadata = { title: 'MyWork — Accounts' };

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  CHECKING: 'Checking',
  SAVINGS: 'Savings',
  CASH: 'Cash',
  CREDIT: 'Credit',
  INVESTMENT: 'Investment',
};

export default async function AccountsPage(): Promise<React.JSX.Element> {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;
  const currency = (session!.user.currency as string) ?? 'GBP';

  const accounts = await getAccounts(userId);
  const accountsWithBalances = await Promise.all(
    accounts.map(async (acc) => ({
      ...acc,
      balance: await getAccountBalance(userId, acc.id),
    })),
  );

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Accounts</h1>
        <Link
          href="/finance/accounts/new"
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 transition-colors"
        >
          New Account
        </Link>
      </div>

      {/* Account list */}
      {accountsWithBalances.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No accounts yet. Add your first account to start tracking finances.
          </p>
          <Link
            href="/finance/accounts/new"
            className="mt-4 inline-block rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 transition-colors"
          >
            Add account
          </Link>
        </div>
      ) : (
        <ul className="space-y-3" role="list">
          {accountsWithBalances.map((acc) => (
            <li
              key={acc.id}
              className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {/* Account info */}
                <Link
                  href={`/finance/accounts/${acc.id}`}
                  className="group flex-1"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base font-semibold text-zinc-900 group-hover:text-teal-600 dark:text-zinc-50 dark:group-hover:text-teal-400">
                      {acc.name}
                    </span>
                    {acc.isDefault && (
                      <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-semibold text-teal-700 dark:bg-teal-900/40 dark:text-teal-400">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
                    {ACCOUNT_TYPE_LABELS[acc.type] ?? acc.type}
                    {acc.description ? ` · ${acc.description}` : ''}
                  </p>
                </Link>

                {/* Balance + actions */}
                <div className="flex items-center gap-4">
                  <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                    {fromMinorUnit(acc.balance, currency)}
                  </p>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/finance/accounts/${acc.id}`}
                      className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    >
                      View
                    </Link>
                    <ArchiveAccountButton
                      accountId={acc.id}
                      accountName={acc.name}
                    />
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
