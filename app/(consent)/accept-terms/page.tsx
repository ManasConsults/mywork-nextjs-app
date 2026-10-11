import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';

import { authOptions } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { hasAcceptedCurrentTerms } from '@/lib/legal/consent';
import { AcceptTermsForm } from './_components/AcceptTermsForm';

export const metadata: Metadata = { title: 'MyWork — Accept terms' };

export default async function AcceptTermsPage(): Promise<React.JSX.Element> {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { termsAcceptedAt: true, termsVersion: true },
  });
  if (!user) redirect('/login');
  if (hasAcceptedCurrentTerms(user)) redirect('/dashboard');

  return <AcceptTermsForm />;
}
