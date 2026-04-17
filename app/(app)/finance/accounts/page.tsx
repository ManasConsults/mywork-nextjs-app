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
        <Link
          href="/finance/accounts/new"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
        >
          New Account
        </Link>
      </div>

      {/* Account list */}
      {accountsWithBalances.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No accounts yet. Add your first account to start tracking finances.
          </p>
          <Link
            href="/finance/accounts/new"
            className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
          >
            Add account
          </Link>
        </div>
      ) : (
        <ul className="space-y-3" role="list">
          {accountsWithBalances.map((acc) => (
            <li
              key={acc.id}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {/* Account info */}
                <Link
                  href={`/finance/accounts/${acc.id}`}
                  className="group flex-1"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base font-semibold text-foreground group-hover:text-primary">
                      {acc.name}
                    </span>
                    {acc.isDefault && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {ACCOUNT_TYPE_LABELS[acc.type] ?? acc.type}
                    {acc.description ? ` · ${acc.description}` : ''}
                  </p>
                </Link>

                {/* Balance + actions */}
                <div className="flex items-center gap-4">
                  <p className="text-lg font-semibold text-foreground">
                    {fromMinorUnit(acc.balance, currency)}
                  </p>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/finance/accounts/${acc.id}`}
                      className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent/40"
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
