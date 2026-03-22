'use client';

import { useState } from 'react';
import { MessageSquarePlus } from 'lucide-react';

import { FeedbackDetailPanel } from './FeedbackDetailPanel';

export interface FeedbackRow {
  id: string;
  type: string;
  status: string;
  title: string;
  description: string;
  module: string;
  createdAt: string;
  user: { name: string | null; email: string };
}

// ─── Shared badge components ──────────────────────────────────────────────────

function TypeBadge({ type }: { type: string }): React.JSX.Element {
  if (type === 'BUG') {
    return (
      <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
        Bug
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700 dark:bg-teal-900/30 dark:text-teal-400">
      Feature Request
    </span>
  );
}

function StatusBadge({ status }: { status: string }): React.JSX.Element {
  if (status === 'IN_REVIEW') {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
        In Review
      </span>
    );
  }
  if (status === 'RESOLVED') {
    return (
      <span className="inline-flex items-center rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700 dark:bg-teal-900/30 dark:text-teal-400">
        Resolved
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
      Open
    </span>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const TH_CLS =
  'px-4 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400';
const ROW_CLS =
  'border-t border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors duration-150';
const TD_CLS = 'px-4 py-3';

// ─── Main component ───────────────────────────────────────────────────────────

export function FeedbackTable({ initialRows }: { initialRows: FeedbackRow[] }): React.JSX.Element {
  const [rows, setRows] = useState<FeedbackRow[]>(initialRows);
  const [selected, setSelected] = useState<FeedbackRow | null>(null);

  function handleStatusUpdated(id: string, newStatus: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r)));
    if (selected?.id === id) {
      setSelected((prev) => (prev ? { ...prev, status: newStatus } : prev));
    }
  }

  function handleRowClick(row: FeedbackRow) {
    setSelected(row);
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-200 bg-white py-16 dark:border-zinc-800 dark:bg-zinc-900">
        <MessageSquarePlus
          size={40}
          strokeWidth={1.5}
          className="text-zinc-300 dark:text-zinc-600"
          aria-hidden="true"
        />
        <p className="mt-3 text-sm font-medium text-zinc-500 dark:text-zinc-400">
          No submissions match the current filters
        </p>
      </div>
    );
  }

  return (
    <>
      {/* ── Mobile card list (hidden on md+) ─────────────────────────────── */}
      <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800 md:hidden">
        {rows.map((row) => (
          <button
            key={row.id}
            type="button"
            onClick={() => handleRowClick(row)}
            className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
            aria-label={`View details for: ${row.title}`}
          >
            <TypeBadge type={row.type} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                {row.title}
              </p>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                {row.user.name ?? 'Unknown'} · {row.module} · {formatDate(row.createdAt)}
              </p>
            </div>
            <StatusBadge status={row.status} />
          </button>
        ))}
      </div>

      {/* ── Desktop table (hidden below md) ──────────────────────────────── */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-800/50">
              <th className={TH_CLS}>Type</th>
              <th className={TH_CLS}>Title</th>
              <th className={TH_CLS}>User</th>
              <th className={TH_CLS}>Module</th>
              <th className={TH_CLS}>Date</th>
              <th className={TH_CLS}>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className={ROW_CLS}
                onClick={() => handleRowClick(row)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') handleRowClick(row);
                }}
                aria-label={`View details for: ${row.title}`}
              >
                <td className={TD_CLS}>
                  <TypeBadge type={row.type} />
                </td>
                <td className={`${TD_CLS} max-w-xs truncate text-sm font-medium text-zinc-900 dark:text-zinc-50`}>
                  {row.title}
                </td>
                <td className={TD_CLS}>
                  <p className="text-sm text-zinc-900 dark:text-zinc-50">
                    {row.user.name ?? <span className="italic text-zinc-400">No name</span>}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{row.user.email}</p>
                </td>
                <td className={`${TD_CLS} text-sm text-zinc-500 dark:text-zinc-400`}>
                  {row.module}
                </td>
                <td className={`${TD_CLS} text-sm tabular-nums text-zinc-500 dark:text-zinc-400`}>
                  {formatDate(row.createdAt)}
                </td>
                <td className={TD_CLS}>
                  <StatusBadge status={row.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail panel */}
      {selected && (
        <FeedbackDetailPanel
          submission={selected}
          onClose={() => setSelected(null)}
          onStatusUpdated={handleStatusUpdated}
        />
      )}
    </>
  );
}
