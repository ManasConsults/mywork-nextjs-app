'use client';

import { useState, useTransition, useRef } from 'react';

import { createTodoAction } from '@/lib/actions/todo';

interface TaskOption {
  id: string;
  title: string;
}

export function AddTodoForm({ tasks }: { tasks: TaskOption[] }): React.JSX.Element {
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [taskId, setTaskId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setError(null);

    startTransition(async () => {
      const result = await createTodoAction({
        title: title.trim(),
        dueDate: dueDate ? new Date(dueDate) : null,
        taskId: taskId || null,
      });
      if (!result.success) {
        setError(result.error.message);
      } else {
        setTitle('');
        setDueDate('');
        setTaskId('');
        titleRef.current?.focus();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div className="min-w-50 flex-1">
        <input
          ref={titleRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
          maxLength={500}
          className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder-zinc-600"
        />
        {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
      </div>

      <input
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        className="rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
      />

      {tasks.length > 0 && (
        <select
          value={taskId}
          onChange={(e) => setTaskId(e.target.value)}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
        >
          <option value="">No linked task</option>
          {tasks.map((t) => (
            <option key={t.id} value={t.id}>{t.title}</option>
          ))}
        </select>
      )}

      <button
        type="submit"
        disabled={isPending || !title.trim()}
        className="rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:opacity-50 dark:bg-teal-500 dark:hover:bg-teal-400"
      >
        {isPending ? 'Adding…' : 'Add'}
      </button>
    </form>
  );
}
