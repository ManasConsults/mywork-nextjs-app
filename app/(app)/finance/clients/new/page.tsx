import type { Metadata } from 'next';
import Link from 'next/link';

import { ClientForm } from '../_components/ClientForm';

export const metadata: Metadata = { title: 'MyWork — New Client' };

export default function NewClientPage(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-xl">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/finance" className="hover:text-zinc-600 dark:hover:text-zinc-300">
          Finance
        </Link>
        <span>/</span>
        <Link href="/finance/clients" className="hover:text-zinc-600 dark:hover:text-zinc-300">
          Clients
        </Link>
        <span>/</span>
        <span className="text-muted-foreground">New</span>
      </nav>

      <div className="rounded-xl border border-border bg-card p-6">
        <ClientForm />
      </div>
    </div>
  );
}
