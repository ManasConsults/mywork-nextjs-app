import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';

import { authOptions } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
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
    },
  });

  const serialized = users.map((u) => ({
    ...u,
    rejectedAt: u.rejectedAt?.toISOString() ?? null,
    createdAt: u.createdAt.toISOString(),
  }));

  const pendingCount = serialized.filter((u) => !u.isActive && !u.rejectedAt).length;

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
          {pendingCount > 0 && (
            <p className="mt-1 text-sm text-red-600">{pendingCount} pending approval</p>
          )}
        </div>
        <span className="shrink-0 text-sm text-gray-500">{users.length} total</span>
      </div>

      <UserTable users={serialized} currentUserId={currentUserId} />
    </div>
  );
}
