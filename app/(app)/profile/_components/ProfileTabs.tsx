'use client';

import { useState } from 'react';

import { ProfileForm } from './ProfileForm';
import { SettingsForm } from './SettingsForm';
import { ChangePasswordForm } from './ChangePasswordForm';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  MEMBER: 'Member',
};

interface ProfileTabsProps {
  name: string | null;
  image: string | null;
  email: string;
  role: string;
  isActive: boolean;
  fiscalYearStartMonth: number;
  hasPassword: boolean;
  createdAt: string; // ISO string (serialisable from RSC)
}

type TabId = 'profile' | 'settings' | 'security' | 'account';

interface Tab {
  id: TabId;
  label: string;
}

export function ProfileTabs({
  name,
  image,
  email,
  role,
  isActive,
  fiscalYearStartMonth,
  hasPassword,
  createdAt,
}: ProfileTabsProps): React.JSX.Element {
  const tabs: Tab[] = [
    { id: 'profile', label: 'Profile' },
    { id: 'settings', label: 'Settings' },
    ...(hasPassword ? [{ id: 'security' as TabId, label: 'Security' }] : []),
    { id: 'account', label: 'Account' },
  ];

  const [activeTab, setActiveTab] = useState<TabId>(tabs[0].id);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      {/* Segmented tab control */}
      <div className="mb-6 flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800/60">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
              activeTab === tab.id
                ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-50'
                : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      <div>
        {activeTab === 'profile' && (
          <ProfileForm initialName={name} initialImage={image} email={email} />
        )}

        {activeTab === 'settings' && (
          <SettingsForm initialFiscalYearStartMonth={fiscalYearStartMonth} />
        )}

        {activeTab === 'security' && hasPassword && (
          <ChangePasswordForm />
        )}

        {activeTab === 'account' && (
          <dl className="space-y-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-zinc-500 dark:text-zinc-400">Role</dt>
              <dd className="font-medium text-zinc-900 dark:text-zinc-50">
                {ROLE_LABELS[role] ?? role}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500 dark:text-zinc-400">Fiscal year starts</dt>
              <dd className="font-medium text-zinc-900 dark:text-zinc-50">
                {MONTH_NAMES[fiscalYearStartMonth - 1]}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500 dark:text-zinc-400">Member since</dt>
              <dd className="font-medium text-zinc-900 dark:text-zinc-50">
                {new Date(createdAt).toLocaleDateString('en-GB', {
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
                    isActive
                      ? 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300'
                      : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}
                >
                  {isActive ? 'Active' : 'Suspended'}
                </span>
              </dd>
            </div>
          </dl>
        )}
      </div>
    </div>
  );
}
