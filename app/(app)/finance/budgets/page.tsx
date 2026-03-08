import Link from 'next/link';
import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';

import { authOptions } from '@/lib/auth/auth';
import { getCategories } from '@/lib/services/finance/category.service';
import { getBudgets, getBudgetProgress } from '@/lib/services/finance/budget.service';
import type { BudgetProgress } from '@/lib/services/finance/budget.service';
import { fromMinorUnit } from '@/lib/utils/money';
import { BudgetForm } from './_components/BudgetForm';
import { DeleteBudgetButton } from './_components/DeleteBudgetButton';

export const metadata: Metadata = { title: 'MyWork — Budgets' };

interface BudgetsPageProps {
  searchParams: Promise<{ add?: string }>;
}

function ProgressBar({
  percentUsed,
  exceeded,
}: {
  percentUsed: number;
  exceeded: boolean;
}): React.JSX.Element {
  const clampedPercent = Math.min(percentUsed, 100);

  return (
    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
      <div
        role="progressbar"
        aria-valuenow={percentUsed}
        aria-valuemin={0}
        aria-valuemax={100}
        style={{ width: `${clampedPercent}%` }}
        className={[
          'h-full rounded-full transition-all',
          exceeded ? 'bg-red-500' : 'bg-teal-500',
        ].join(' ')}
      />
    </div>
  );
}

export default async function BudgetsPage({
  searchParams,
}: BudgetsPageProps): Promise<React.JSX.Element> {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;
  const currency = (session!.user.currency as string) ?? 'GBP';

  const [allBudgets, allCategories, { add }] = await Promise.all([
    getBudgets(userId),
    getCategories(userId),
    searchParams,
  ]);

  const showAddForm = add === '1';

  // Fetch progress for all budgets in parallel
  const progressResults = await Promise.all(
    allBudgets.map((b) => getBudgetProgress(userId, b.id)),
  );

  // Filter out nulls (type narrowing)
  const progressItems: BudgetProgress[] = progressResults.filter(
    (p): p is BudgetProgress => p !== null,
  );

  const monthly = progressItems.filter((p) => p.budget.period === 'MONTHLY');
  const annual = progressItems.filter((p) => p.budget.period === 'ANNUAL');

  const sections = [
    { key: 'MONTHLY', label: 'Monthly Budgets', items: monthly },
    { key: 'ANNUAL', label: 'Annual Budgets', items: annual },
  ] as const;

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Budgets
        </h1>
        {!showAddForm && (
          <Link
            href="/finance/budgets?add=1"
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
          >
            + New Budget
          </Link>
        )}
      </div>

      {/* Inline add form */}
      {showAddForm && (
        <div className="mb-8 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              New Budget
            </h2>
            <Link
              href="/finance/budgets"
              className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              Cancel
            </Link>
          </div>
          <BudgetForm categories={allCategories} />
        </div>
      )}

      {/* Empty state */}
      {allBudgets.length === 0 && !showAddForm && (
        <div className="rounded-xl border border-dashed border-zinc-200 bg-white p-10 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No budgets yet. Set one up to track your spending against a limit.
          </p>
          <Link
            href="/finance/budgets?add=1"
            className="mt-3 inline-block text-sm font-medium text-teal-600 underline underline-offset-2 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
          >
            Create your first budget
          </Link>
        </div>
      )}

      {/* Budget groups */}
      {allBudgets.length > 0 && (
        <div className="space-y-8">
          {sections.map(({ key, label, items }) => {
            if (items.length === 0) return null;

            return (
              <section key={key} aria-labelledby={`heading-${key}`}>
                <h2
                  id={`heading-${key}`}
                  className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
                >
                  {label}
                </h2>

                <ul
                  role="list"
                  className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  {items.map(
                    ({ budget, category, spent, remaining, percentUsed }) => {
                      const exceeded = spent > budget.amount;

                      return (
                        <li
                          key={budget.id}
                          className={[
                            'px-4 py-4',
                            exceeded
                              ? 'bg-red-50 dark:bg-red-900/10'
                              : '',
                          ].join(' ')}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p
                                  className={[
                                    'truncate text-sm font-medium',
                                    exceeded
                                      ? 'text-red-700 dark:text-red-400'
                                      : 'text-zinc-900 dark:text-zinc-50',
                                  ].join(' ')}
                                >
                                  {category.name}
                                </p>
                                {exceeded && (
                                  <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-900/40 dark:text-red-400">
                                    Exceeded
                                  </span>
                                )}
                              </div>

                              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                                {fromMinorUnit(spent, currency)} spent of{' '}
                                {fromMinorUnit(budget.amount, currency)} budget
                                {' · '}
                                {fromMinorUnit(remaining, currency)} remaining
                              </p>

                              <ProgressBar
                                percentUsed={percentUsed}
                                exceeded={exceeded}
                              />

                              <p
                                className={[
                                  'mt-1 text-xs font-medium',
                                  exceeded
                                    ? 'text-red-600 dark:text-red-400'
                                    : 'text-zinc-500 dark:text-zinc-400',
                                ].join(' ')}
                              >
                                {percentUsed}% used
                              </p>
                            </div>

                            <DeleteBudgetButton
                              id={budget.id}
                              categoryName={category.name}
                            />
                          </div>
                        </li>
                      );
                    },
                  )}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
