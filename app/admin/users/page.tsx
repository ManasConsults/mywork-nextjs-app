import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';

import { authOptions } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { isDeletionDue } from '@/lib/legal/deletion';
import { UserTable } from './_components/UserTable';

export const metadata: Metadata = { title: 'MyWork Admin — Users' };

export default async function AdminUsersPage(): Promise<React.JSX.Element> {
  const session = await getServerSession(authOptions);
  const currentUserId = session!.user.id;

  const users = await prisma.user.findMany({
    orderBy: [{ isActive: 'asc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      rejectedAt: true,
      moduleWork: true,
      moduleFinance: true,
      employmentType: true,
      createdAt: true,
      deletionRequestedAt: true,
    },
  });

  const now = new Date();
  const serialized = users.map(({ deletionRequestedAt, ...u }) => ({
    ...u,
    rejectedAt: u.rejectedAt?.toISOString() ?? null,
    createdAt: u.createdAt.toISOString(),
    deletionRequestedAt: deletionRequestedAt?.toISOString() ?? null,
    deletionDue: deletionRequestedAt ? isDeletionDue(deletionRequestedAt, now) : false,
  }));

  const pendingCount = serialized.filter((u) => !u.isActive && !u.rejectedAt && !u.deletionRequestedAt).length;
  const dueCount = serialized.filter((u) => u.deletionDue).length;

  return (
    <div>
      {dueCount > 0 && (
        <p role="status" className="mb-4 text-sm font-medium text-destructive">
          {dueCount} {dueCount === 1 ? 'account' : 'accounts'} ready for deletion
        </p>
      )}
      {pendingCount > 0 && (
        <p className="mb-4 text-sm text-destructive">{pendingCount} pending approval</p>
      )}
      <UserTable users={serialized} currentUserId={currentUserId} />
    </div>
  );
}
