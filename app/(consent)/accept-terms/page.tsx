import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';

import { authOptions } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { hasAcceptedCurrentTerms } from '@/lib/legal/consent';
import { computeDeletionDueAt, toBrisbaneIsoDate } from '@/lib/legal/deletion';
import { AcceptTermsForm } from './_components/AcceptTermsForm';

export const metadata: Metadata = { title: 'MyWork — Accept terms' };

export default async function AcceptTermsPage(): Promise<React.JSX.Element> {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { termsAcceptedAt: true, termsVersion: true, deletionRequestedAt: true },
  });
  if (!user) redirect('/login');
  if (user.deletionRequestedAt) {
    const deletionDate = toBrisbaneIsoDate(computeDeletionDueAt(user.deletionRequestedAt));
    redirect(`/login?${new URLSearchParams({ error: 'AccountDeletionPending', deletionDate }).toString()}`);
  }
  if (hasAcceptedCurrentTerms(user)) redirect('/dashboard');

  return <AcceptTermsForm />;
}
