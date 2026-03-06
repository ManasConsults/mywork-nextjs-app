import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import type { ReactNode } from 'react';

import { authOptions } from '@/lib/auth/auth';

export default async function WorkModuleLayout({
  children,
}: {
  children: ReactNode;
}): Promise<React.JSX.Element> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.moduleWork) redirect('/module-unavailable');

  return <>{children}</>;
}
