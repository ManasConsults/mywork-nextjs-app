'use client';

import { useState } from 'react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ProfileForm } from './ProfileForm';
import { SettingsForm } from './SettingsForm';
import { ChangePasswordForm } from './ChangePasswordForm';
import { EmploymentTypeForm } from './EmploymentTypeForm';
import { BusinessDetailsForm } from './BusinessDetailsForm';

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
  currency: string;
  themeColor: string;
  hasPassword: boolean;
  createdAt: string;
  employmentType: string;
  businessName: string | null;
  abn: string | null;
  businessEmail: string | null;
  businessPhone: string | null;
  businessAddress: string | null;
}

type TabId = 'profile' | 'settings' | 'security' | 'account' | 'employment' | 'business';

export function ProfileTabs({
  name,
  image,
  email,
  role,
  isActive,
  fiscalYearStartMonth,
  currency,
  themeColor,
  hasPassword,
  createdAt,
  employmentType,
  businessName,
  abn,
  businessEmail,
  businessPhone,
  businessAddress,
}: ProfileTabsProps): React.JSX.Element {
  const isSoleTrader = employmentType === 'SOLE_TRADER' || employmentType === 'BOTH';

  const tabs: { id: TabId; label: string }[] = [
    { id: 'profile', label: 'Profile' },
    { id: 'settings', label: 'Settings' },
    { id: 'employment', label: 'Employment' },
    ...(isSoleTrader ? [{ id: 'business' as TabId, label: 'Business' }] : []),
    ...(hasPassword ? [{ id: 'security' as TabId, label: 'Security' }] : []),
    { id: 'account', label: 'Account' },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <Tabs defaultValue={tabs[0].id}>
        <TabsList className="mb-6 w-full">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="flex-1">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="profile">
          <ProfileForm initialName={name} initialImage={image} email={email} />
        </TabsContent>

        <TabsContent value="settings">
          <SettingsForm initialFiscalYearStartMonth={fiscalYearStartMonth} initialCurrency={currency} initialThemeColor={themeColor} />
        </TabsContent>

        <TabsContent value="employment">
          <EmploymentTypeForm initialEmploymentType={employmentType} />
        </TabsContent>

        {isSoleTrader && (
          <TabsContent value="business">
            <BusinessDetailsForm
              initialBusinessName={businessName}
              initialAbn={abn}
              initialBusinessEmail={businessEmail}
              initialBusinessPhone={businessPhone}
              initialBusinessAddress={businessAddress}
            />
          </TabsContent>
        )}

        {hasPassword && (
          <TabsContent value="security">
            <ChangePasswordForm />
          </TabsContent>
        )}

        <TabsContent value="account">
          <dl className="space-y-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Role</dt>
              <dd className="font-medium text-foreground">
                {ROLE_LABELS[role] ?? role}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Fiscal year starts</dt>
              <dd className="font-medium text-foreground">
                {MONTH_NAMES[fiscalYearStartMonth - 1]}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Default currency</dt>
              <dd className="font-medium text-foreground">{currency}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Member since</dt>
              <dd className="font-medium text-foreground">
                {new Date(createdAt).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Account status</dt>
              <dd>
                <Badge variant={isActive ? 'default' : 'destructive'} className={isActive ? 'bg-primary/5 text-primary' : ''}>
                  {isActive ? 'Active' : 'Suspended'}
                </Badge>
              </dd>
            </div>
          </dl>
        </TabsContent>
      </Tabs>
    </div>
  );
}
