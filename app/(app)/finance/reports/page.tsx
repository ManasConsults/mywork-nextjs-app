import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';
import type { CategoryType } from '@prisma/client';

import { authOptions } from '@/lib/auth/auth';
import {
  getProfitAndLoss,
  getCashFlow,
  getTaxSummary,
  getUnbilledHours,
} from '@/lib/services/finance/report.service';
import { fromMinorUnit } from '@/lib/utils/money';
import { ReportFilters } from './_components/ReportFilters';

export const metadata: Metadata = { title: 'MyWork — Reports' };

// ─── Types ────────────────────────────────────────────────────────────────────

type ReportType = 'pnl' | 'cashflow' | 'tax' | 'unbilled';

interface ReportsPageProps {
  searchParams: Promise<{
    type?: string;
    from?: string;
    to?: string;
    categoryType?: string;
    months?: string;
    taxYear?: string;
  }>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const VALID_REPORT_TYPES: ReportType[] = ['pnl', 'cashflow', 'tax', 'unbilled'];
const VALID_CATEGORY_TYPES: CategoryType[] = ['PERSONAL', 'WORK_RELATED', 'BUSINESS'];

function isValidReportType(v: string): v is ReportType {
  return (VALID_REPORT_TYPES as string[]).includes(v);
}

function isValidCategoryType(v: string): v is CategoryType {
  return (VALID_CATEGORY_TYPES as string[]).includes(v);
}

/**
 * Parse the taxYear param (e.g. "uk-2025" or "cal-2025") into a Date.
 * UK mode: April 6; Calendar mode: January 1.
 */
function parseTaxYearStart(taxYear: string | undefined): Date {
  if (!taxYear) {
    const year = new Date().getFullYear();
    return new Date(`${year}-04-06`);
  }
  if (taxYear.startsWith('uk-')) {
    const year = parseInt(taxYear.replace('uk-', ''), 10);
    return new Date(`${year}-04-06`);
  }
  if (taxYear.startsWith('cal-')) {
    const year = parseInt(taxYear.replace('cal-', ''), 10);
    return new Date(`${year}-01-01`);
  }
  const year = new Date().getFullYear();
  return new Date(`${year}-04-06`);
}

function defaultMonthRange(): { from: Date; to: Date } {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { from, to };
}

function formatMonthLabel(year: number, month: number): string {
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  change,
  changeLabel,
  currency = 'GBP',
  isExpense = false,
  highlight = false,
}: {
  label: string;
  value: string;
  change?: number;
  changeLabel?: string;
  currency?: string;
  isExpense?: boolean;
  highlight?: boolean;
}): React.JSX.Element {
  const isPositiveChange = (change ?? 0) >= 0;

  return (
    <div
      className={`rounded-xl border p-4 ${
        highlight
          ? 'border-zinc-200 bg-teal-50 dark:border-zinc-800 dark:bg-teal-900/20'
          : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900'
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
        {label}
      </p>
      <p
        className={`mt-1 text-2xl font-bold ${
          isExpense
            ? 'text-red-600 dark:text-red-400'
            : highlight
              ? 'text-teal-700 dark:text-teal-400'
              : 'text-zinc-900 dark:text-zinc-50'
        }`}
      >
        {value}
      </p>
      {change !== undefined && changeLabel && (
        <p
          className={`mt-1 text-xs ${
            isPositiveChange
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          }`}
        >
          {isPositiveChange ? '+' : ''}
          {fromMinorUnit(change, currency)} {changeLabel}
        </p>
      )}
    </div>
  );
}

function CategoryTypeBadge({ type }: { type: string }): React.JSX.Element {
  const cls: Record<string, string> = {
    PERSONAL: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
    WORK_RELATED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
    BUSINESS: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400',
  };
  const labels: Record<string, string> = {
    PERSONAL: 'Personal',
    WORK_RELATED: 'Work',
    BUSINESS: 'Business',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${cls[type] ?? cls.PERSONAL}`}
    >
      {labels[type] ?? type}
    </span>
  );
}

function ExpenseTable({
  title,
  rows,
  total,
  currency,
}: {
  title: string;
  rows: { categoryName: string; amount: number }[];
  total: number;
  currency: string;
}): React.JSX.Element {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{title}</h3>
      </div>
      <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
        <thead>
          <tr>
            <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Category
            </th>
            <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Amount
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {rows.map((row) => (
            <tr key={row.categoryName} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
              <td className="px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300">
                {row.categoryName}
              </td>
              <td className="px-4 py-2.5 text-right text-sm text-red-600 dark:text-red-400">
                {fromMinorUnit(row.amount, currency)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/40">
            <td className="px-4 py-2.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Total
            </td>
            <td className="px-4 py-2.5 text-right text-sm font-semibold text-red-600 dark:text-red-400">
              {fromMinorUnit(total, currency)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function EmptyState({ message }: { message: string }): React.JSX.Element {
  return (
    <div className="rounded-xl border border-dashed border-zinc-200 bg-white p-10 text-center dark:border-zinc-700 dark:bg-zinc-900">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{message}</p>
    </div>
  );
}

// ─── P&L Sub-section ─────────────────────────────────────────────────────────

async function ProfitAndLossReport({
  userId,
  from,
  to,
  categoryType,
  currency,
}: {
  userId: string;
  from: Date;
  to: Date;
  categoryType: CategoryType | null;
  currency: string;
}): Promise<React.JSX.Element> {
  const data = await getProfitAndLoss(userId, from, to, categoryType);

  const incomeChange = data.income - data.previousIncome;
  const netChange = data.net - (data.previousIncome - data.previousExpenses);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Total Income"
          value={fromMinorUnit(data.income, currency)}
          change={incomeChange}
          changeLabel="vs previous period"
          currency={currency}
        />
        <SummaryCard
          label="Total Expenses"
          value={fromMinorUnit(data.expenses, currency)}
          isExpense
        />
        <SummaryCard
          label="Net"
          value={fromMinorUnit(data.net, currency)}
          change={netChange}
          changeLabel="vs previous period"
          currency={currency}
          highlight
        />
      </div>

      {data.byCategory.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Breakdown by Category
            </h2>
          </div>
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Category
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Type
                </th>
                <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Income
                </th>
                <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Expenses
                </th>
                <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Net
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {data.byCategory.map((row) => (
                <tr key={row.categoryId} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                  <td className="px-4 py-2.5 text-sm text-zinc-800 dark:text-zinc-200">
                    {row.categoryName}
                  </td>
                  <td className="px-4 py-2.5 text-sm">
                    <CategoryTypeBadge type={row.categoryType} />
                  </td>
                  <td className="px-4 py-2.5 text-right text-sm text-green-600 dark:text-green-400">
                    {row.income > 0 ? fromMinorUnit(row.income, currency) : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-right text-sm text-red-600 dark:text-red-400">
                    {row.expenses > 0 ? fromMinorUnit(row.expenses, currency) : '—'}
                  </td>
                  <td
                    className={`px-4 py-2.5 text-right text-sm font-medium ${
                      row.income - row.expenses >= 0
                        ? 'text-zinc-700 dark:text-zinc-300'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {fromMinorUnit(row.income - row.expenses, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState message="No transactions found for this period." />
      )}
    </div>
  );
}

// ─── Cash Flow Sub-section ────────────────────────────────────────────────────

async function CashFlowReport({
  userId,
  months,
  currency,
}: {
  userId: string;
  months: number;
  currency: string;
}): Promise<React.JSX.Element> {
  const data = await getCashFlow(userId, months);

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Monthly Cash Flow
        </h2>
      </div>
      {data.months.length === 0 ? (
        <div className="p-8 text-center text-sm text-zinc-400 dark:text-zinc-500">
          No data available.
        </div>
      ) : (
        <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Month
              </th>
              <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Income
              </th>
              <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Expenses
              </th>
              <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Net
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {data.months.map((m) => (
              <tr
                key={`${m.year}-${m.month}`}
                className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
              >
                <td className="px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300">
                  {formatMonthLabel(m.year, m.month)}
                </td>
                <td className="px-4 py-2.5 text-right text-sm text-green-600 dark:text-green-400">
                  {m.income > 0 ? fromMinorUnit(m.income, currency) : '—'}
                </td>
                <td className="px-4 py-2.5 text-right text-sm text-red-600 dark:text-red-400">
                  {m.expenses > 0 ? fromMinorUnit(m.expenses, currency) : '—'}
                </td>
                <td
                  className={`px-4 py-2.5 text-right text-sm font-semibold ${
                    m.net >= 0
                      ? 'text-teal-600 dark:text-teal-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {fromMinorUnit(m.net, currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ─── Tax Summary Sub-section ──────────────────────────────────────────────────

async function TaxSummaryReport({
  userId,
  taxYear,
  currency,
}: {
  userId: string;
  taxYear: string | undefined;
  currency: string;
}): Promise<React.JSX.Element> {
  const taxYearStart = parseTaxYearStart(taxYear);
  const data = await getTaxSummary(userId, taxYearStart);

  const totalBusinessExpenses = data.businessExpenses.reduce((s, e) => s + e.amount, 0);
  const totalWorkRelated = data.workRelatedExpenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800/60 dark:bg-amber-900/20">
        <p className="text-sm text-amber-800 dark:text-amber-300">
          <strong>Disclaimer:</strong> This report is for reference only and does not constitute
          financial or tax advice. Please consult a qualified accountant or tax adviser before
          filing your tax return.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard label="Business Income" value={fromMinorUnit(data.businessIncome, currency)} />
        <SummaryCard
          label="Business Expenses"
          value={fromMinorUnit(totalBusinessExpenses, currency)}
          isExpense
        />
        <SummaryCard
          label="Net Business Profit"
          value={fromMinorUnit(data.netBusinessProfit, currency)}
          highlight
        />
      </div>

      {data.businessExpenses.length > 0 && (
        <ExpenseTable
          title="Business Expenses"
          rows={data.businessExpenses}
          total={totalBusinessExpenses}
          currency={currency}
        />
      )}

      {data.workRelatedExpenses.length > 0 && (
        <ExpenseTable
          title="Work-Related Expenses"
          rows={data.workRelatedExpenses}
          total={totalWorkRelated}
          currency={currency}
        />
      )}

      {data.businessExpenses.length === 0 && data.workRelatedExpenses.length === 0 && (
        <EmptyState message="No business or work-related transactions found for this tax year." />
      )}
    </div>
  );
}

// ─── Unbilled Hours Sub-section ───────────────────────────────────────────────

async function UnbilledHoursReport({
  userId,
  currency,
}: {
  userId: string;
  currency: string;
}): Promise<React.JSX.Element> {
  const data = await getUnbilledHours(userId);

  if (data.clients.length === 0) {
    return <EmptyState message="No unbilled work logs found." />;
  }

  return (
    <div className="space-y-6">
      {data.clients.map((client) => (
        <div
          key={client.clientId}
          className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              {client.clientName}
            </h2>
            <span className="text-xs text-zinc-400 dark:text-zinc-500">
              {client.totalHours.toFixed(2)} hrs &middot; {fromMinorUnit(client.totalValue, currency)}
            </span>
          </div>
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Date
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Description
                </th>
                <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Hours
                </th>
                <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Rate/hr
                </th>
                <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Est. Value
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {client.entries.map((entry) => (
                <tr key={entry.workLogId} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                  <td className="whitespace-nowrap px-4 py-2.5 text-sm text-zinc-500 dark:text-zinc-400">
                    {new Date(entry.date).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300">
                    {entry.description}
                  </td>
                  <td className="px-4 py-2.5 text-right text-sm text-zinc-700 dark:text-zinc-300">
                    {entry.hours.toFixed(2)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-sm text-zinc-500 dark:text-zinc-400">
                    {entry.rate > 0 ? fromMinorUnit(entry.rate, currency) : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-right text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {entry.rate > 0 ? fromMinorUnit(entry.estimatedValue, currency) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/40">
                <td
                  colSpan={2}
                  className="px-4 py-2.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300"
                >
                  Client Total
                </td>
                <td className="px-4 py-2.5 text-right text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  {client.totalHours.toFixed(2)}
                </td>
                <td />
                <td className="px-4 py-2.5 text-right text-sm font-semibold text-teal-600 dark:text-teal-400">
                  {fromMinorUnit(client.totalValue, currency)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      ))}

      {/* Grand total */}
      <div className="flex items-center justify-between rounded-xl border border-teal-200 bg-teal-50 px-5 py-4 dark:border-teal-800/60 dark:bg-teal-900/20">
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Grand Total</span>
        <div className="flex items-center gap-6">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            {data.grandTotalHours.toFixed(2)} hrs
          </span>
          <span className="text-base font-bold text-teal-700 dark:text-teal-400">
            {fromMinorUnit(data.grandTotalValue, currency)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ReportsPage({
  searchParams,
}: ReportsPageProps): Promise<React.JSX.Element> {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;
  const currency = (session!.user.currency as string) ?? 'GBP';

  const params = await searchParams;
  const reportType: ReportType =
    params.type && isValidReportType(params.type) ? params.type : 'pnl';

  const categoryType =
    params.categoryType && isValidCategoryType(params.categoryType)
      ? params.categoryType
      : undefined;

  const { from: defaultFrom, to: defaultTo } = defaultMonthRange();
  const from = params.from ? new Date(params.from) : defaultFrom;
  const to = params.to ? new Date(params.to) : defaultTo;
  const months = params.months ? Math.min(12, Math.max(1, parseInt(params.months, 10))) : 12;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Reports</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Financial reports and analysis for your accounts.
        </p>
      </div>

      <Suspense>
        <ReportFilters
          type={reportType}
          currentFrom={params.from}
          currentTo={params.to}
          currentCategoryType={params.categoryType}
          currentMonths={params.months}
          currentTaxYear={params.taxYear}
        />
      </Suspense>

      {reportType === 'pnl' && (
        <ProfitAndLossReport
          userId={userId}
          from={from}
          to={to}
          categoryType={categoryType ?? null}
          currency={currency}
        />
      )}
      {reportType === 'cashflow' && (
        <CashFlowReport userId={userId} months={months} currency={currency} />
      )}
      {reportType === 'tax' && (
        <TaxSummaryReport userId={userId} taxYear={params.taxYear} currency={currency} />
      )}
      {reportType === 'unbilled' && <UnbilledHoursReport userId={userId} currency={currency} />}
    </div>
  );
}
