'use client';

import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function NoteDetailError({ error, reset }: ErrorProps): React.JSX.Element {
  useEffect(() => {
    // Log to structured logger when available
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-3xl rounded-md bg-red-50 px-4 py-8 text-center dark:bg-red-900/20">
      <p className="text-sm text-red-700 dark:text-red-400">Failed to load note.</p>
      <button
        onClick={reset}
        className="mt-3 text-sm font-medium text-primary underline"
      >
        Try again
      </button>
    </div>
  );
}
