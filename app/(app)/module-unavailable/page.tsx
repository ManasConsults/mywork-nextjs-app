import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'MyWork — Module Unavailable' };

export default function ModuleUnavailablePage(): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
      <div className="flex size-16 items-center justify-center rounded-full bg-muted">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-muted-foreground"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
        </svg>
      </div>
      <p className="max-w-sm text-muted-foreground">
        You don&apos;t have access to this module. Contact your administrator to enable it for your
        account.
      </p>
      <Link
        href="/dashboard"
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
      >
        Return to Dashboard
      </Link>
    </div>
  );
}
