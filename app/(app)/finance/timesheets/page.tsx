import Link from 'next/link';
import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';
import type { Prisma } from '@prisma/client';

import { authOptions } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { fromMinorUnit } from '@/lib/utils/money';
import { TimesheetFilters } from './_components/TimesheetFilters';
import { AddTimesheetEntryForm } from './_components/AddTimesheetEntryForm';
import { TimesheetRow } from './_components/TimesheetRowActions';

export const metadata: Metadata = { title: 'MyWork — Timesheets' };

// ─── Types ────────────────────────────────────────────────────────────────────

type BillingStatus = 'unbilled' | 'billed' | 'all';

interface TimesheetsPageProps {
  searchParams: Promise<{
    clientId?: string;
    from?: string;
    to?: string;
    status?: string;
  }>;
}

// Derive the WorkLog row type from the Prisma include shape used in the query
type WorkLogWithClient = Prisma.WorkLogGetPayload<{
  include: { client: { select: { id: true; name: true; defaultRate: true } } };
}>;

interface ClientGroup {
  clientId: string;
  clientName: string;
  rows: WorkLogWithClient[];
  totalUnbilledHours: number;
  totalBilledHours: number;
  totalUnbilledValue: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const VALID_STATUSES: BillingStatus[] = ['unbilled', 'billed', 'all'];

function isValidStatus(v: string): v is BillingStatus {
  return (VALID_STATUSES as string[]).includes(v);
}

function hoursFromMinutes(minutes: number | null): number {
  return (minutes ?? 0) / 60;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function TimesheetsPage({
  searchParams,
}: TimesheetsPageProps): Promise<React.JSX.Element> {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;
  const currency = (session!.user.currency as string) ?? 'GBP';

  const params = await searchParams;
  const filterClientId = params.clientId ?? undefined;
  const filterFrom = params.from ? new Date(params.from) : undefined;
  const filterTo = params.to ? new Date(params.to) : undefined;
  const filterStatus: BillingStatus =
    params.status && isValidStatus(params.status) ? params.status : 'unbilled';

  // Build billing-status filter
  const billedAtFilter: { billedAt?: null | { not: null } } = {};
  if (filterStatus === 'unbilled') billedAtFilter.billedAt = null;
  if (filterStatus === 'billed') billedAtFilter.billedAt = { not: null };

  const [clients, workLogs] = await Promise.all([
    prisma.client.findMany({
      where: { userId, archivedAt: null },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, defaultRate: true },
    }),
    prisma.workLog.findMany({
      where: {
        userId,
        billable: true,
        ...(filterClientId ? { clientId: filterClientId } : {}),
        ...(filterFrom || filterTo
          ? {
              date: {
                ...(filterFrom ? { gte: filterFrom } : {}),
                ...(filterTo ? { lte: filterTo } : {}),
              },
            }
          : {}),
        ...billedAtFilter,
      },
      include: {
        client: { select: { id: true, name: true, defaultRate: true } },
      },
      orderBy: { date: 'desc' },
    }),
  ]);

  // Group work logs by client
  const clientMap = new Map<string, ClientGroup>();

  for (const log of workLogs) {
    if (!log.client) continue;

    const key = log.client.id;
    const hours = hoursFromMinutes(log.timeSpent);
    const rate = log.client.defaultRate ?? 0;
    const value = Math.round(hours * rate);
    const isBilled = log.billedAt !== null;

    const existing = clientMap.get(key);
    if (existing) {
      existing.rows.push(log);
      if (isBilled) {
        existing.totalBilledHours += hours;
      } else {
        existing.totalUnbilledHours += hours;
        existing.totalUnbilledValue += value;
      }
    } else {
      clientMap.set(key, {
        clientId: log.client.id,
        clientName: log.client.name,
        rows: [log],
        totalUnbilledHours: isBilled ? 0 : hours,
        totalBilledHours: isBilled ? hours : 0,
        totalUnbilledValue: isBilled ? 0 : value,
      });
    }
  }

  const clientGroups = Array.from(clientMap.values());

  // Grand totals
  let grandTotalHours = 0;
  let grandTotalValue = 0;
  for (const group of clientGroups) {
    grandTotalHours += group.totalUnbilledHours + group.totalBilledHours;
    grandTotalValue += group.totalUnbilledValue;
  }

  const clientOptions = clients.map((c) => ({ id: c.id, name: c.name }));

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Timesheets</h1>
        {clients.length > 0 && <AddTimesheetEntryForm clients={clientOptions} />}
      </div>

      {/* Add entry form — shown when no clients exist */}
      {clients.length === 0 && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800/60 dark:bg-amber-900/20 dark:text-amber-300">
          Add a client first before logging timesheet entries.
        </div>
      )}

      {/* Filters */}
      <Suspense>
        <TimesheetFilters
          clients={clientOptions}
          currentClientId={filterClientId}
          currentFrom={params.from}
          currentTo={params.to}
          currentStatus={filterStatus}
        />
      </Suspense>

      {/* Content */}
      {clientGroups.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 bg-white p-10 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No timesheet entries found for the selected filters.</p>
          {clients.length > 0 && (
            <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
              Use the &ldquo;+ New Entry&rdquo; button above to log time against a client.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {clientGroups.map((group) => (
            <ClientTimesheetGroup key={group.clientId} group={group} currency={currency} />
          ))}

          {/* Grand total row */}
          <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-teal-50 px-5 py-4 dark:border-zinc-800 dark:bg-teal-900/20">
            <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Grand Total
            </span>
            <div className="flex items-center gap-6">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                {grandTotalHours.toFixed(2)} hrs total
              </span>
              <span className="text-base font-bold text-teal-700 dark:text-teal-400">
                {fromMinorUnit(grandTotalValue, currency)} unbilled
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Client group component ───────────────────────────────────────────────────

function ClientTimesheetGroup({
  group,
  currency,
}: {
  group: ClientGroup;
  currency: string;
}): React.JSX.Element {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      {/* Client header */}
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          {group.clientName}
        </h2>
        <div className="flex items-center gap-4">
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            <span className="text-amber-600 dark:text-amber-400">
              {group.totalUnbilledHours.toFixed(2)} hrs
            </span>{' '}
            unbilled &middot;{' '}
            <span className="text-green-600 dark:text-green-400">
              {group.totalBilledHours.toFixed(2)} hrs
            </span>{' '}
            billed
          </span>
          {group.totalUnbilledValue > 0 && (
            <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
              {fromMinorUnit(group.totalUnbilledValue, currency)} unbilled value
            </span>
          )}
          <Link
            href={`/finance/invoices/new?clientId=${group.clientId}`}
            className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 transition-colors hover:bg-teal-100 dark:border-teal-800/60 dark:bg-teal-900/20 dark:text-teal-400 dark:hover:bg-teal-900/40"
          >
            Create Invoice
          </Link>
        </div>
      </div>

      {/* Work log rows */}
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
            <th className="hidden px-4 py-2 text-right text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 sm:table-cell">
              Rate/hr
            </th>
            <th className="hidden px-4 py-2 text-right text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 sm:table-cell">
              Value
            </th>
            <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Status
            </th>
            <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {group.rows.map((log) => {
            const hours = hoursFromMinutes(log.timeSpent);
            const rate = log.client?.defaultRate ?? 0;
            const value = Math.round(hours * rate);
            const isBilled = log.billedAt !== null;

            return (
              <TimesheetRow
                key={log.id}
                id={log.id}
                date={log.date}
                description={log.description}
                timeSpentMinutes={log.timeSpent}
                rate={rate}
                value={value}
                currency={currency}
                isBilled={isBilled}
                formattedDate={new Date(log.date).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
                formattedRate={rate > 0 ? fromMinorUnit(rate, currency) : '—'}
                formattedValue={rate > 0 ? fromMinorUnit(value, currency) : '—'}
              />
            );
          })}
        </tbody>
        {/* Subtotal row */}
        <tfoot>
          <tr className="border-t border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/40">
            <td
              colSpan={2}
              className="px-4 py-2.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300"
            >
              Subtotal
            </td>
            <td className="px-4 py-2.5 text-right text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              {(group.totalUnbilledHours + group.totalBilledHours).toFixed(2)}
            </td>
            <td className="hidden sm:table-cell" />
            <td className="hidden px-4 py-2.5 text-right text-sm font-semibold text-teal-600 dark:text-teal-400 sm:table-cell">
              {fromMinorUnit(group.totalUnbilledValue, currency)}
            </td>
            <td />
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
