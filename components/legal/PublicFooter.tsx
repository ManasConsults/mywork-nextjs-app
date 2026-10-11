import Link from 'next/link';

import { TRADING_NAME } from '@/lib/legal/constants';
import { cn } from '@/lib/utils';

const LINKS = [
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
  { href: '/data-deletion', label: 'Data deletion' },
  { href: '/about', label: 'About' },
  { href: '/help', label: 'Help' },
] as const;

export function PublicFooter({ className }: { className?: string }): React.JSX.Element {
  return (
    <footer className={cn('border-t border-border bg-background', className)}>
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-1 px-4 py-4 sm:flex-row sm:justify-between sm:px-6">
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} MyWork by {TRADING_NAME}
        </p>
        <nav aria-label="Legal and help">
          <ul className="flex flex-wrap items-center justify-center">
            {LINKS.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg px-3 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
