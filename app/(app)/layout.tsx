import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import type { ReactNode } from 'react';

import { authOptions } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { AppShell } from './_components/AppShell';

export default async function AppLayout({ children }: { children: ReactNode }): Promise<React.JSX.Element> {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const isAdmin = (session.user as { role?: string }).role === 'ADMIN';
  const pendingCount = isAdmin
    ? await prisma.user.count({ where: { isActive: false } })
    : 0;

  return <AppShell user={session.user} pendingCount={pendingCount}>{children}</AppShell>;
}
