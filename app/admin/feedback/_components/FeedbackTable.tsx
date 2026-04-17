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
      <span className="inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
        Bug
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-primary/5 px-2 py-0.5 text-xs font-medium text-primary">
      Feature Request
    </span>
  );
}

function StatusBadge({ status }: { status: string }): React.JSX.Element {
  if (status === 'IN_REVIEW') {
    return (
      <span className="inline-flex items-center rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
        In Review
      </span>
    );
  }
  if (status === 'DEFERRED') {
    return (
      <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
        Deferred
      </span>
    );
  }
  if (status === 'RESOLVED') {
    return (
      <span className="inline-flex items-center rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
        Resolved
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
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
  'px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground';
const ROW_CLS =
  'border-t border-border/60 hover:bg-muted/30 cursor-pointer transition-colors duration-150';
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
      <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16">
        <MessageSquarePlus
          size={40}
          strokeWidth={1.5}
          className="text-muted-foreground"
          aria-hidden="true"
        />
        <p className="mt-3 text-sm font-medium text-muted-foreground">
          No submissions match the current filters
        </p>
      </div>
    );
  }

  return (
    <>
      {/* ── Mobile card list (hidden on md+) ─────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card divide-y divide-border md:hidden">
        {rows.map((row) => (
          <button
            key={row.id}
            type="button"
            onClick={() => handleRowClick(row)}
            className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/30"
            aria-label={`View details for: ${row.title}`}
          >
            <TypeBadge type={row.type} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {row.title}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {row.user.name ?? 'Unknown'} · {row.module} · {formatDate(row.createdAt)}
              </p>
            </div>
            <StatusBadge status={row.status} />
          </button>
        ))}
      </div>

      {/* ── Desktop table (hidden below md) ──────────────────────────────── */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-muted/50">
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
                <td className={`${TD_CLS} max-w-xs truncate text-sm font-medium text-foreground`}>
                  {row.title}
                </td>
                <td className={TD_CLS}>
                  <p className="text-sm text-foreground">
                    {row.user.name ?? <span className="italic text-muted-foreground">No name</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">{row.user.email}</p>
                </td>
                <td className={`${TD_CLS} text-sm text-muted-foreground`}>
                  {row.module}
                </td>
                <td className={`${TD_CLS} text-sm tabular-nums text-muted-foreground`}>
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
