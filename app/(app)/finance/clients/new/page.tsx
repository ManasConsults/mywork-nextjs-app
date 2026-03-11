import type { Metadata } from 'next';
import Link from 'next/link';

import { ClientForm } from '../_components/ClientForm';

export const metadata: Metadata = { title: 'MyWork — New Client' };

export default function NewClientPage(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-xl">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-1.5 text-sm text-zinc-400 dark:text-zinc-500">
        <Link href="/finance" className="hover:text-zinc-600 dark:hover:text-zinc-300">
          Finance
        </Link>
        <span>/</span>
        <Link href="/finance/clients" className="hover:text-zinc-600 dark:hover:text-zinc-300">
          Clients
        </Link>
        <span>/</span>
        <span className="text-zinc-600 dark:text-zinc-300">New</span>
      </nav>

      <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">New Client</h1>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <ClientForm />
      </div>
    </div>
  );
}
