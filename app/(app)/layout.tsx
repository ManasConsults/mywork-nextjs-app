import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import type { ReactNode } from 'react';

import { authOptions } from '@/lib/auth/auth';
import { AppShell } from './_components/AppShell';

export default async function AppLayout({ children }: { children: ReactNode }): Promise<React.JSX.Element> {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  return <AppShell user={session.user}>{children}</AppShell>;
}
