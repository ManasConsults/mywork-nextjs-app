'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { NOTE_SORT_BY, NOTE_PAGE_SIZES } from '@/lib/schemas/note.schema';

interface TaskOption {
  id: string;
  title: string;
}

interface NoteFiltersBarProps {
  tasks: TaskOption[];
  currentTag?: string;
  currentTaskId?: string;
  currentSortBy: string;
  currentSortOrder: string;
  currentPageSize: number;
}

const SORT_BY_LABELS: Record<string, string> = {
  createdAt: 'Created date',
  updatedAt: 'Updated date',
};

const SELECT_CLS =
  'rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300';

export function NoteFiltersBar({
  tasks,
  currentTag,
  currentTaskId,
  currentSortBy,
  currentSortOrder,
  currentPageSize,
}: NoteFiltersBarProps): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tagInput, setTagInput] = useState('');

  function updateParams(updates: Record<string, string | undefined>, resetPage = true) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    if (resetPage) params.delete('page');
    router.push(`/notes?${params.toString()}`);
  }

  function handleTagSubmit(e: React.FormEvent) {
    e.preventDefault();
    const tag = tagInput.trim();
    if (tag) {
      updateParams({ tag });
      setTagInput('');
    }
  }

  function clearAllFilters() {
    const params = new URLSearchParams();
    if (searchParams.get('sortBy')) params.set('sortBy', searchParams.get('sortBy')!);
    if (searchParams.get('sortOrder')) params.set('sortOrder', searchParams.get('sortOrder')!);
    if (searchParams.get('pageSize')) params.set('pageSize', searchParams.get('pageSize')!);
    router.push(`/notes?${params.toString()}`);
  }

  const hasFilters = Boolean(currentTag || currentTaskId);

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      {/* Tag filter */}
      {currentTag ? (
        <span className="flex items-center gap-1 rounded-full bg-teal-50 px-3 py-1 text-sm font-medium text-teal-700 dark:bg-teal-900/30 dark:text-teal-300">
          #{currentTag}
          <button
            type="button"
            onClick={() => updateParams({ tag: undefined })}
            className="ml-1 text-teal-500 hover:text-teal-700"
            aria-label="Remove tag filter"
          >
            ×
          </button>
        </span>
      ) : (
        <form onSubmit={handleTagSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="Filter by tag…"
            className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
          />
          {tagInput.trim() && (
            <button
              type="submit"
              className="rounded-md bg-teal-50 px-2 py-1.5 text-xs font-medium text-teal-700 hover:bg-teal-100 dark:bg-teal-900/30 dark:text-teal-300"
            >
              Filter
            </button>
          )}
        </form>
      )}

      {/* Task filter */}
      <select
        value={currentTaskId ?? ''}
        onChange={(e) => updateParams({ taskId: e.target.value || undefined })}
        className={SELECT_CLS}
      >
        <option value="">All tasks</option>
        {tasks.map((t) => (
          <option key={t.id} value={t.id}>
            {t.title}
          </option>
        ))}
      </select>

      {/* Clear filters */}
      {hasFilters && (
        <button
          type="button"
          onClick={clearAllFilters}
          className="text-sm text-zinc-400 underline hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
        >
          Clear filters
        </button>
      )}

      {/* Sort + page size */}
      <div className="ml-auto flex items-center gap-2">
        <select
          value={currentSortBy}
          onChange={(e) => updateParams({ sortBy: e.target.value }, false)}
          className={SELECT_CLS}
          aria-label="Sort by"
        >
          {NOTE_SORT_BY.map((s) => (
            <option key={s} value={s}>
              {SORT_BY_LABELS[s]}
            </option>
          ))}
        </select>

        <select
          value={currentSortOrder}
          onChange={(e) => updateParams({ sortOrder: e.target.value }, false)}
          className={SELECT_CLS}
          aria-label="Sort order"
        >
          <option value="desc">Newest first</option>
          <option value="asc">Oldest first</option>
        </select>

        <select
          value={currentPageSize}
          onChange={(e) => updateParams({ pageSize: e.target.value })}
          className={SELECT_CLS}
          aria-label="Items per page"
        >
          {NOTE_PAGE_SIZES.map((n) => (
            <option key={n} value={n}>
              {n} per page
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
