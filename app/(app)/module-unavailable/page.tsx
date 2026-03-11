import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'MyWork — Module Unavailable' };

export default function ModuleUnavailablePage(): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-zinc-400"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
        </svg>
      </div>
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Module Unavailable
      </h1>
      <p className="max-w-sm text-zinc-500 dark:text-zinc-400">
        You don&apos;t have access to this module. Contact your administrator to enable it for your
        account.
      </p>
      <Link
        href="/dashboard"
        className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700"
      >
        Return to Dashboard
      </Link>
    </div>
  );
}
