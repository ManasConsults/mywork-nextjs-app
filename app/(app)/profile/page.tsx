import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';

import { authOptions } from '@/lib/auth/auth';
import { getUserById } from '@/lib/services/user.service';
import { ProfileTabs } from './_components/ProfileTabs';

export const metadata: Metadata = { title: 'MyWork — Profile' };

const ROLE_LABELS: Record<string, string> = { ADMIN: 'Admin', MANAGER: 'Manager', MEMBER: 'Member' };

export default async function ProfilePage(): Promise<React.JSX.Element> {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const user = await getUserById(userId);
  if (!user) notFound();

  const initials = (user.name ?? user.email)
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Profile &amp; Settings</h1>

      {/* Avatar + identity summary */}
      <div style={{ marginTop: '1.5rem' }} className="flex items-center gap-4 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.image}
            alt={user.name ?? 'Avatar'}
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-100 text-xl font-semibold text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
            {initials}
          </div>
        )}
        <div>
          <p className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
            {user.name ?? 'No name set'}
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{user.email}</p>
          <span className="mt-1 inline-block rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
            {ROLE_LABELS[user.role] ?? user.role}
          </span>
        </div>
      </div>

      {/* Tabbed settings card */}
      <div style={{ marginTop: '1.5rem' }}>
        <ProfileTabs
          name={user.name}
          image={user.image}
          email={user.email}
          role={user.role}
          isActive={user.isActive}
          fiscalYearStartMonth={user.fiscalYearStartMonth}
          hasPassword={!!user.passwordHash}
          createdAt={user.createdAt.toISOString()}
        />
      </div>
    </div>
  );
}
