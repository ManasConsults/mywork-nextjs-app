import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';

import { authOptions } from '@/lib/auth/auth';
import { getClientById } from '@/lib/services/finance/client.service';
import { ClientForm } from '../../_components/ClientForm';

export const metadata: Metadata = { title: 'MyWork — Edit Client' };

interface EditClientPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditClientPage({
  params,
}: EditClientPageProps): Promise<React.JSX.Element> {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const { id } = await params;
  const client = await getClientById(userId, id);

  if (!client) {
    redirect('/finance/clients');
  }

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
        <Link
          href={`/finance/clients/${client.id}`}
          className="hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          {client.name}
        </Link>
        <span>/</span>
        <span className="text-muted-foreground">Edit</span>
      </nav>

      <div className="rounded-xl border border-border bg-card p-6">
        <ClientForm client={client} />
      </div>
    </div>
  );
}
