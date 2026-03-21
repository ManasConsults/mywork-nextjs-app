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
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-4 sm:px-6">
        <div className="flex h-14 items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <span className="shrink-0 font-bold text-[0.9375rem] text-teal-600">
              MyWork Admin
            </span>
            <Link
              href="/admin"
              className="text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/users"
              className="text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Users
            </Link>
          </div>
          <Link
            href="/dashboard"
            className="shrink-0 text-sm text-gray-500 hover:text-gray-700"
          >
            ← Back to app
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
