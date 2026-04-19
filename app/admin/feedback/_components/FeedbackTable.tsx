'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MessageSquarePlus, ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';

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

interface FeedbackTableProps {
  initialRows: FeedbackRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  activeType: string;
  activeStatus: string;
}

export function FeedbackTable({
  initialRows,
  total,
  page,
  pageSize,
  totalPages,
  activeType,
  activeStatus,
}: FeedbackTableProps): React.JSX.Element {
  const [rows, setRows] = useState<FeedbackRow[]>(initialRows);
  const [selected, setSelected] = useState<FeedbackRow | null>(null);

  function handleStatusUpdated(id: string, newStatus: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r)));
    if (selected?.id === id) {
      setSelected((prev) => (prev ? { ...prev, status: newStatus } : prev));
    }
  }

  function buildPageHref(p: number): string {
    const params = new URLSearchParams();
    params.set('type', activeType);
    params.set('status', activeStatus);
    if (pageSize !== 10) params.set('pageSize', String(pageSize));
    if (p > 1) params.set('page', String(p));
    return `/admin/feedback?${params.toString()}`;
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
    <div className="flex flex-col gap-4">
      {/* ── Mobile card list (hidden on md+) ─────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card divide-y divide-border md:hidden">
        {rows.map((row) => (
          <button
            key={row.id}
            type="button"
            onClick={() => setSelected(row)}
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
                onClick={() => setSelected(row)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') setSelected(row);
                }}
                aria-label={`View details for: ${row.title}`}
              >
                <td className={TD_CLS}>
                  <TypeBadge type={row.type} />
                </td>
                <td className={cn(TD_CLS, 'max-w-xs truncate text-sm font-medium text-foreground')}>
                  {row.title}
                </td>
                <td className={TD_CLS}>
                  <p className="text-sm text-foreground">
                    {row.user.name ?? <span className="italic text-muted-foreground">No name</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">{row.user.email}</p>
                </td>
                <td className={cn(TD_CLS, 'text-sm text-muted-foreground')}>
                  {row.module}
                </td>
                <td className={cn(TD_CLS, 'text-sm tabular-nums text-muted-foreground')}>
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

      {/* ── Pagination ────────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-muted-foreground">
            {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
          </p>
          <div className="flex items-center gap-1">
            <Link
              href={buildPageHref(page - 1)}
              aria-label="Previous page"
              aria-disabled={page <= 1}
              className={cn(
                'inline-flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
                page <= 1 && 'pointer-events-none opacity-40',
              )}
            >
              <ChevronLeft size={14} />
            </Link>
            <span className="px-2 text-xs tabular-nums text-muted-foreground">
              {page} / {totalPages}
            </span>
            <Link
              href={buildPageHref(page + 1)}
              aria-label="Next page"
              aria-disabled={page >= totalPages}
              className={cn(
                'inline-flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
                page >= totalPages && 'pointer-events-none opacity-40',
              )}
            >
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      )}

      {/* Detail panel */}
      {selected && (
        <FeedbackDetailPanel
          submission={selected}
          onClose={() => setSelected(null)}
          onStatusUpdated={handleStatusUpdated}
        />
      )}
    </div>
  );
}
