import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import type { ReactNode } from 'react';
import Link from 'next/link';

import { authOptions } from '@/lib/auth/auth';

export default async function AdminLayout({ children }: { children: ReactNode }): Promise<React.JSX.Element> {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  const user = session.user as { role?: string };
  if (user.role !== 'ADMIN') redirect('/dashboard');

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <header
        style={{
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e5e7eb',
          padding: '0 1.5rem',
          height: '3.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#0d9488' }}>
            MyWork Admin
          </span>
          <Link
            href="/admin/users"
            style={{ fontSize: '0.875rem', color: '#374151', textDecoration: 'none', fontWeight: 500 }}
          >
            Users
          </Link>
        </div>
        <Link
          href="/dashboard"
          style={{ fontSize: '0.875rem', color: '#6b7280', textDecoration: 'none' }}
        >
          ← Back to app
        </Link>
      </header>
      <main style={{ maxWidth: '72rem', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {children}
      </main>
    </div>
  );
}
