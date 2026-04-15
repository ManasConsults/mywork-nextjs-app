'use client';

import { useState, useTransition, useRef } from 'react';

import { createTodoAction } from '@/lib/actions/todo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
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
        <Input
          ref={titleRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
          maxLength={500}
          disabled={isPending}
        />
        {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
      </div>

      <Input
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        className="w-auto"
        disabled={isPending}
      />

      {tasks.length > 0 && (
        <Select value={taskId} onValueChange={setTaskId} disabled={isPending}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="No linked task" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_none">No linked task</SelectItem>
            {tasks.map((t) => (
              <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Button type="submit" disabled={isPending || !title.trim()}>
        {isPending ? 'Adding…' : 'Add'}
      </Button>
    </form>
  );
}
