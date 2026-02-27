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
      createdAt: true,
    },
  });

  const serialized = users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() }));
  const pendingCount = serialized.filter((u) => !u.isActive).length;

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#111827', margin: 0 }}>
            Users
          </h1>
          {pendingCount > 0 && (
            <p style={{ fontSize: '0.875rem', color: '#dc2626', marginTop: '0.25rem', marginBottom: 0 }}>
              {pendingCount} pending approval
            </p>
          )}
        </div>
        <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>{users.length} total</span>
      </div>

      <UserTable users={serialized} currentUserId={currentUserId} />
    </div>
  );
}
