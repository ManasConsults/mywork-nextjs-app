'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { addFromWorkLogsAction } from '@/lib/actions/finance/line-item';
import { toMinorUnit } from '@/lib/utils/money';

interface WorkLogOption {
  id: string;
  date: Date;
  description: string;
  timeSpent: number | null; // minutes
}

interface AddFromWorkLogsFormProps {
  invoiceId: string;
  workLogs: WorkLogOption[];
  defaultRate: number | null; // minor units
}

export function AddFromWorkLogsForm({
  invoiceId,
  workLogs,
  defaultRate,
}: AddFromWorkLogsFormProps): React.JSX.Element {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [unitPriceStr, setUnitPriceStr] = useState(
    defaultRate != null ? (defaultRate / 100).toFixed(2) : '',
  );
  const [error, setError] = useState<string | null>(null);

  if (workLogs.length === 0) return <></>;

  function toggleAll(checked: boolean) {
    setSelected(checked ? new Set(workLogs.map((wl) => wl.id)) : new Set());
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSubmit() {
    if (selected.size === 0) {
      setError('Select at least one work log entry.');
      return;
    }
    const unitPrice = parseFloat(unitPriceStr);
    if (isNaN(unitPrice) || unitPrice <= 0) {
      setError('Enter a valid unit price per hour.');
      return;
    }
    setError(null);

    startTransition(async () => {
      const result = await addFromWorkLogsAction(
        invoiceId,
        Array.from(selected),
        toMinorUnit(unitPrice),
      );

      if (!result.success) {
        setError(result.error.message);
        return;
      }

      setSelected(new Set());
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="mt-4">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-lg border border-teal-300 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-700 transition-colors hover:bg-teal-100 dark:border-teal-800/60 dark:bg-teal-900/20 dark:text-teal-400 dark:hover:bg-teal-900/40"
        >
          + Add from Work Logs ({workLogs.length} unbilled)
        </button>
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/40">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              Select work log entries
            </h3>
            <button
              type="button"
              onClick={() => { setOpen(false); setError(null); }}
              className="text-xs text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              Cancel
            </button>
          </div>

          {error && (
            <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </p>
          )}

          {/* Unit price */}
          <div className="mb-3 flex items-center gap-3">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Rate / hr
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={unitPriceStr}
              onChange={(e) => setUnitPriceStr(e.target.value)}
              className="w-28 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            />
          </div>

          {/* Select all */}
          <label className="mb-2 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <input
              type="checkbox"
              checked={selected.size === workLogs.length}
              onChange={(e) => toggleAll(e.target.checked)}
              className="rounded"
            />
            Select all
          </label>

          {/* Work log list */}
          <div className="max-h-64 overflow-y-auto divide-y divide-zinc-100 rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-700 dark:bg-zinc-900">
            {workLogs.map((wl) => {
              const hours = (wl.timeSpent ?? 0) / 60;
              return (
                <label
                  key={wl.id}
                  className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(wl.id)}
                    onChange={() => toggle(wl.id)}
                    className="rounded"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-zinc-800 dark:text-zinc-200">
                      {wl.description}
                    </p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">
                      {new Date(wl.date).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                      {' · '}
                      {hours.toFixed(2)} hrs
                    </p>
                  </div>
                </label>
              );
            })}
          </div>

          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending || selected.size === 0}
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:opacity-50"
            >
              {isPending
                ? 'Adding…'
                : `Add ${selected.size > 0 ? selected.size : ''} entry${selected.size === 1 ? '' : 's'}`}
            </button>
            <span className="text-xs text-zinc-400 dark:text-zinc-500">
              {selected.size} of {workLogs.length} selected
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
