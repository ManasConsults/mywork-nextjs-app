'use client';

import { useState, useTransition } from 'react';

import { updateEmploymentTypeAction } from '@/lib/actions/user';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const EMPLOYMENT_OPTIONS = [
  { value: 'EMPLOYED', label: 'Employee', description: 'Day job / PAYE employment only' },
  { value: 'SOLE_TRADER', label: 'Sole Trader', description: 'Self-employed / freelance only' },
  { value: 'BOTH', label: 'Both', description: 'Employee and sole trader simultaneously' },
] as const;

type EmploymentTypeValue = 'EMPLOYED' | 'SOLE_TRADER' | 'BOTH';

export function EmploymentTypeForm({
  initialEmploymentType,
}: {
  initialEmploymentType: string;
}): React.JSX.Element {
  const [selected, setSelected] = useState<EmploymentTypeValue>(
    initialEmploymentType as EmploymentTypeValue,
  );
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const res = await updateEmploymentTypeAction({ employmentType: selected });
      if (res.success) {
        setMessage({ type: 'success', text: 'Employment type updated.' });
      } else {
        setMessage({ type: 'error', text: res.error.message });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {EMPLOYMENT_OPTIONS.map(({ value, label, description }) => (
          <label
            key={value}
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors',
              selected === value
                ? 'border-primary/80 bg-primary/5 dark:border-primary'
                : 'border-border hover:border-ring/50',
            )}
          >
            <input
              type="radio"
              name="employmentType"
              value={value}
              checked={selected === value}
              onChange={() => setSelected(value)}
              className="mt-0.5 accent-primary"
            />
            <div>
              <p className="text-sm font-medium text-foreground">{label}</p>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          </label>
        ))}
      </div>

      {message && (
        <p
          className={
            message.type === 'success'
              ? 'text-sm text-primary'
              : 'text-sm text-red-600 dark:text-red-400'
          }
        >
          {message.text}
        </p>
      )}

      <Button
        type="submit"
        disabled={isPending || selected === (initialEmploymentType as EmploymentTypeValue)}
      >
        {isPending ? 'Saving…' : 'Save'}
      </Button>
    </form>
  );
}
