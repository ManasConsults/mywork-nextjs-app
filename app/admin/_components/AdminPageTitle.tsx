'use client';

import { usePathname } from 'next/navigation';

const TITLES: Record<string, string> = {
  '/admin': 'Usage Dashboard',
  '/admin/users': 'Users',
  '/admin/feedback': 'Feedback',
};

export function AdminPageTitle(): React.JSX.Element {
  const pathname = usePathname();
  const title = TITLES[pathname] ?? 'Admin';
  return (
    <span className="text-base font-semibold text-foreground">{title}</span>
  );
}
