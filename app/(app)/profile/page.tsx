import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';

import { authOptions } from '@/lib/auth/auth';
import { getUserById } from '@/lib/services/user.service';
import { ProfileForm } from './_components/ProfileForm';
import { SettingsForm } from './_components/SettingsForm';
import { ChangePasswordForm } from './_components/ChangePasswordForm';

export const metadata: Metadata = { title: 'MyWork — Profile' };

function Section({ title, children }: { title: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-5 text-base font-semibold text-zinc-900 dark:text-zinc-50">{title}</h2>
      {children}
    </section>
  );
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  MEMBER: 'Member',
};

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
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Profile &amp; Settings</h1>

      {/* Avatar + identity summary */}
      <div className="flex items-center gap-4 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
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

      {/* Profile details */}
      <Section title="Profile details">
        <ProfileForm
          initialName={user.name}
          initialImage={user.image}
          email={user.email}
        />
      </Section>

      {/* App settings */}
      <Section title="App settings">
        <SettingsForm initialFiscalYearStartMonth={user.fiscalYearStartMonth} />
      </Section>

      {/* Change password — only for credential accounts */}
      {user.passwordHash && (
        <Section title="Change password">
          <ChangePasswordForm />
        </Section>
      )}

      {/* Account info (read-only) */}
      <Section title="Account information">
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-zinc-500 dark:text-zinc-400">Role</dt>
            <dd className="font-medium text-zinc-900 dark:text-zinc-50">{ROLE_LABELS[user.role] ?? user.role}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-zinc-500 dark:text-zinc-400">Fiscal year starts</dt>
            <dd className="font-medium text-zinc-900 dark:text-zinc-50">
              {MONTH_NAMES[user.fiscalYearStartMonth - 1]}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-zinc-500 dark:text-zinc-400">Member since</dt>
            <dd className="font-medium text-zinc-900 dark:text-zinc-50">
              {user.createdAt.toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-zinc-500 dark:text-zinc-400">Account status</dt>
            <dd>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  user.isActive
                    ? 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300'
                    : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}
              >
                {user.isActive ? 'Active' : 'Suspended'}
              </span>
            </dd>
          </div>
        </dl>
      </Section>
    </div>
  );
}
