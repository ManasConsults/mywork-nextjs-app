import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import type { ReactNode } from 'react';

import { authOptions } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { getThemeCSS } from '@/lib/theme';
import { AppShell } from './_components/AppShell';
import { AppSessionProvider } from './_components/AppSessionProvider';

// All (app) pages are authenticated and user-specific — never pre-render during build.
export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: ReactNode }): Promise<React.JSX.Element> {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const [pendingCount, userPrefs] = await Promise.all([
    (session.user as { role?: string }).role === 'ADMIN'
      ? prisma.user.count({ where: { isActive: false } })
      : Promise.resolve(0),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { themeColor: true },
    }),
  ]);

  const themeCSS = getThemeCSS(userPrefs?.themeColor ?? 'teal');

  return (
    <AppSessionProvider>
      <style dangerouslySetInnerHTML={{ __html: themeCSS }} />
      <AppShell user={session.user} pendingCount={pendingCount}>{children}</AppShell>
    </AppSessionProvider>
  );
}
