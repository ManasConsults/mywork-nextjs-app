'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { NOTE_SORT_BY, NOTE_PAGE_SIZES } from '@/lib/schemas/note.schema';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

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

  function updateParams(updates: Record<string, string | undefined>, resetPage = true): void {
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

  function handleTagSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    const tag = tagInput.trim();
    if (tag) {
      updateParams({ tag });
      setTagInput('');
    }
  }

  function clearAllFilters(): void {
    const params = new URLSearchParams();
    if (searchParams.get('sortBy')) params.set('sortBy', searchParams.get('sortBy')!);
    if (searchParams.get('sortOrder')) params.set('sortOrder', searchParams.get('sortOrder')!);
    if (searchParams.get('pageSize')) params.set('pageSize', searchParams.get('pageSize')!);
    router.push(`/notes?${params.toString()}`);
  }

  const hasFilters = Boolean(currentTag || currentTaskId);

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      {currentTag ? (
        <span className="flex items-center gap-1 rounded-full bg-primary/5 px-3 py-1 text-sm font-medium text-primary">
          #{currentTag}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => updateParams({ tag: undefined })}
            className="ml-1 h-auto p-0 text-primary hover:text-primary hover:bg-transparent"
            aria-label="Remove tag filter"
          >
            ×
          </Button>
        </span>
      ) : (
        <form onSubmit={handleTagSubmit} className="flex items-center gap-2">
          <Input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="Filter by tag…"
            className="w-36"
          />
          {tagInput.trim() && (
            <Button type="submit" variant="secondary" size="sm">
              Filter
            </Button>
          )}
        </form>
      )}

      <Select
        value={currentTaskId ?? ''}
        onValueChange={(v) => updateParams({ taskId: v === '_all' ? undefined : v })}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="All tasks" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_all">All tasks</SelectItem>
          {tasks.map((t) => (
            <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clearAllFilters}
          className="h-auto p-0 text-sm text-muted-foreground underline hover:text-foreground hover:bg-transparent"
        >
          Clear filters
        </Button>
      )}

      <div className="ml-auto flex items-center gap-2">
        <Select value={currentSortBy} onValueChange={(v) => updateParams({ sortBy: v }, false)}>
          <SelectTrigger className="w-36" aria-label="Sort by">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {NOTE_SORT_BY.map((s) => (
              <SelectItem key={s} value={s}>{SORT_BY_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={currentSortOrder} onValueChange={(v) => updateParams({ sortOrder: v }, false)}>
          <SelectTrigger className="w-32" aria-label="Sort order">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">Newest first</SelectItem>
            <SelectItem value="asc">Oldest first</SelectItem>
          </SelectContent>
        </Select>

        <Select value={String(currentPageSize)} onValueChange={(v) => updateParams({ pageSize: v })}>
          <SelectTrigger className="w-28" aria-label="Items per page">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {NOTE_PAGE_SIZES.map((n) => (
              <SelectItem key={n} value={String(n)}>{n} per page</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
