'use client';

import { useOptimistic, useTransition, useState } from 'react';
import Link from 'next/link';

import { updateTodoAction, deleteTodoAction } from '@/lib/actions/todo';
import type { TodoItemWithTask } from '@/lib/services/todo.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type DueStatus = 'done' | 'overdue' | 'today' | 'upcoming' | 'none';

function getDueStatus(dueDate: Date | string | null, isDone: boolean): DueStatus {
  if (isDone) return 'done';
  if (!dueDate) return 'none';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dueDate);
  const due = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (due < today) return 'overdue';
  if (due.getTime() === today.getTime()) return 'today';
  return 'upcoming';
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function formatDateInput(date: Date | string | null): string {
  if (!date) return '';
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface TaskOption {
  id: string;
  title: string;
}

interface EditState {
  id: string;
  title: string;
  dueDate: string;
  taskId: string;
  isDone: boolean;
}

interface TodoListProps {
  todos: TodoItemWithTask[];
  tasks: TaskOption[];
}

export function TodoList({ todos, tasks }: TodoListProps): React.JSX.Element {
  const [, startTransition] = useTransition();
  const [editState, setEditState] = useState<EditState | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [optimisticTodos, applyOptimistic] = useOptimistic(
    todos,
    (
      current: TodoItemWithTask[],
      action:
        | { type: 'toggle'; id: string }
        | { type: 'delete'; id: string },
    ) => {
      if (action.type === 'toggle') {
        return current.map((t) => t.id === action.id ? { ...t, isDone: !t.isDone } : t);
      }
      return current.filter((t) => t.id !== action.id);
    },
  );

  function handleToggle(todo: TodoItemWithTask) {
    startTransition(async () => {
      applyOptimistic({ type: 'toggle', id: todo.id });
      await updateTodoAction(todo.id, { isDone: !todo.isDone });
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      applyOptimistic({ type: 'delete', id });
      await deleteTodoAction(id);
    });
  }

  async function handleSaveEdit() {
    if (!editState) return;
    setIsSavingEdit(true);
    await updateTodoAction(editState.id, {
      title: editState.title,
      dueDate: editState.dueDate ? new Date(editState.dueDate) : null,
      taskId: editState.taskId || null,
      isDone: editState.isDone,
    });
    setIsSavingEdit(false);
    setEditState(null);
  }

  if (optimisticTodos.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border py-16 text-center">
        <p className="text-sm text-muted-foreground">No to-dos yet. Add one above!</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2 py-2">
      {optimisticTodos.map((todo) => {
        const status = getDueStatus(todo.dueDate, todo.isDone);
        const edit = editState?.id === todo.id ? editState : null;

        return (
          <li
            key={todo.id}
            className="rounded-lg bg-card px-4 py-3"
          >
            {edit ? (
              /* ── Edit mode ── */
              <div className="space-y-3">
                <Input
                  type="text"
                  value={edit.title}
                  onChange={(e) => setEditState({ ...edit, title: e.target.value })}
                  maxLength={500}
                  autoFocus
                />
                <div className="flex flex-wrap items-center gap-3">
                  <Input
                    type="date"
                    value={edit.dueDate}
                    onChange={(e) => setEditState({ ...edit, dueDate: e.target.value })}
                    className="w-auto"
                  />
                  {tasks.length > 0 && (
                    <Select
                      value={edit.taskId}
                      onValueChange={(v) => setEditState({ ...edit, taskId: v === '_none' ? '' : v })}
                    >
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
                  {/* Done toggle in edit mode */}
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={edit.isDone}
                      onChange={(e) => setEditState({ ...edit, isDone: e.target.checked })}
                      className="h-4 w-4 rounded border-zinc-300 accent-primary"
                    />
                    Mark as done
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => void handleSaveEdit()}
                    disabled={isSavingEdit || !edit.title.trim()}
                  >
                    {isSavingEdit ? 'Saving…' : 'Save'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditState(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              /* ── View mode ── */
              <div className="flex items-start gap-3">
                {/* Circle checkbox — custom design, not a standard button */}
                <button
                  type="button"
                  onClick={() => handleToggle(todo)}
                  aria-label={todo.isDone ? 'Mark as not done' : 'Mark as done'}
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                    todo.isDone
                      ? 'border-primary/80 bg-primary/50'
                      : 'border-zinc-300 hover:border-primary/50 dark:border-zinc-600 dark:hover:border-primary/80'
                  }`}
                >
                  {todo.isDone && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <span className={`text-sm ${
                    todo.isDone
                      ? 'text-zinc-400 line-through dark:text-zinc-500'
                      : 'text-zinc-800 dark:text-zinc-100'
                  }`}>
                    {todo.title}
                  </span>

                  {/* Meta row */}
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    {todo.task && (
                      <Link
                        href={`/tasks/${todo.task.id}`}
                        className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                        </svg>
                        {todo.task.title}
                      </Link>
                    )}
                    {todo.dueDate && (
                      <span
                        className="rounded-full px-2 py-0.5 text-xs font-medium"
                        style={
                          status === 'overdue' ? { backgroundColor: '#fecaca', color: '#dc2626' } :
                          status === 'today' ? { backgroundColor: '#fef08a', color: '#854d0e' } :
                          status === 'upcoming' ? { backgroundColor: '#ccfbf1', color: '#0f766e' } :
                          status === 'done' ? { backgroundColor: '#f4f4f5', color: '#a1a1aa' } :
                          {}
                        }
                      >
                        {status === 'overdue' && 'Overdue · '}
                        {status === 'today' && 'Due today · '}
                        {formatDate(todo.dueDate)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggle(todo)}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      todo.isDone
                        ? 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-700'
                        : 'bg-primary/5 text-primary hover:bg-primary/10'
                    }`}
                  >
                    {todo.isDone ? 'Undo' : 'Mark done'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditState({
                      id: todo.id,
                      title: todo.title,
                      dueDate: formatDateInput(todo.dueDate),
                      taskId: todo.taskId ?? '',
                      isDone: todo.isDone,
                    })}
                    className="h-auto p-0 text-xs text-zinc-400 underline hover:text-zinc-600 hover:bg-transparent dark:text-zinc-500 dark:hover:text-zinc-300"
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(todo.id)}
                    className="h-auto p-0 text-xs text-red-400 underline hover:text-red-600 hover:bg-transparent dark:text-red-500 dark:hover:text-red-300"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
