'use client';

import { useState } from 'react';

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

function TypeBadge({ type }: { type: string }): React.JSX.Element {
  if (type === 'BUG') {
    return (
      <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
        Bug
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-700 dark:bg-teal-900/30 dark:text-teal-400">
      Feature Request
    </span>
  );
}

function StatusBadge({ status }: { status: string }): React.JSX.Element {
  if (status === 'IN_REVIEW') {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
        In Review
      </span>
    );
  }
  if (status === 'RESOLVED') {
    return (
      <span className="inline-flex items-center rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-700 dark:bg-teal-900/30 dark:text-teal-400">
        Resolved
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
      Open
    </span>
  );
}

export function FeedbackTable({ initialRows }: { initialRows: FeedbackRow[] }): React.JSX.Element {
  const [rows, setRows] = useState<FeedbackRow[]>(initialRows);
  const [selected, setSelected] = useState<FeedbackRow | null>(null);

  function handleStatusUpdated(id: string, newStatus: string) {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r)),
    );
    if (selected?.id === id) {
      setSelected((prev) => (prev ? { ...prev, status: newStatus } : prev));
    }
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-200 bg-white py-16 dark:border-zinc-800 dark:bg-zinc-900">
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-zinc-300 dark:text-zinc-600"
          aria-hidden="true"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <p className="mt-3 text-sm font-medium text-zinc-500 dark:text-zinc-400">
          No submissions match the current filters
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-800/50">
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Type
              </th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Title
              </th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                User
              </th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Module
              </th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Date
              </th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const isEven = index % 2 === 0;
              const rowBg = isEven
                ? 'bg-white dark:bg-zinc-900'
                : 'bg-zinc-50 dark:bg-zinc-800/50';
              return (
                <tr
                  key={row.id}
                  className={`${rowBg} cursor-pointer hover:bg-teal-50 dark:hover:bg-zinc-800 transition-colors`}
                  onClick={() => setSelected(row)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') setSelected(row);
                  }}
                  aria-label={`View details for: ${row.title}`}
                >
                  <td className="border-t border-zinc-100 px-4 py-3 dark:border-zinc-800">
                    <TypeBadge type={row.type} />
                  </td>
                  <td className="border-t border-zinc-100 px-4 py-3 text-sm font-medium text-zinc-900 dark:border-zinc-800 dark:text-zinc-50 max-w-xs truncate">
                    {row.title}
                  </td>
                  <td className="border-t border-zinc-100 px-4 py-3 dark:border-zinc-800">
                    <p className="text-sm text-zinc-900 dark:text-zinc-50">
                      {row.user.name ?? <span className="italic text-zinc-400">No name</span>}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{row.user.email}</p>
                  </td>
                  <td className="border-t border-zinc-100 px-4 py-3 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                    {row.module}
                  </td>
                  <td className="border-t border-zinc-100 px-4 py-3 text-sm text-zinc-500 tabular-nums dark:border-zinc-800 dark:text-zinc-400">
                    {new Date(row.createdAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="border-t border-zinc-100 px-4 py-3 dark:border-zinc-800">
                    <StatusBadge status={row.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

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
