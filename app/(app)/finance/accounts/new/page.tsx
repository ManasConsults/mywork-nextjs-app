import type { Metadata } from 'next';
import Link from 'next/link';

import { AccountForm } from '../_components/AccountForm';

export const metadata: Metadata = { title: 'MyWork — New Account' };

export default function NewAccountPage(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-xl">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-1.5 text-sm text-zinc-400 dark:text-zinc-500">
        <Link href="/finance" className="hover:text-zinc-600 dark:hover:text-zinc-300">
          Finance
        </Link>
        <span>/</span>
        <Link href="/finance/accounts" className="hover:text-zinc-600 dark:hover:text-zinc-300">
          Accounts
        </Link>
        <span>/</span>
        <span className="text-zinc-600 dark:text-zinc-300">New</span>
      </nav>

      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50 mb-6">
        New Account
      </h1>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <AccountForm />
      </div>
    </div>
  );
}
