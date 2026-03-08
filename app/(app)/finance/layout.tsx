import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import type { ReactNode } from 'react';

import { authOptions } from '@/lib/auth/auth';
import { FinanceProvider } from './_components/FinanceProvider';

export default async function FinanceModuleLayout({
  children,
}: {
  children: ReactNode;
}): Promise<React.JSX.Element> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.moduleFinance) redirect('/module-unavailable');

  const employmentType =
    (session.user.employmentType as 'EMPLOYED' | 'SOLE_TRADER' | 'BOTH') ?? 'EMPLOYED';
  const currency = (session.user.currency as string) ?? 'GBP';

  return (
    <FinanceProvider employmentType={employmentType} currency={currency}>
      {children}
    </FinanceProvider>
  );
}
