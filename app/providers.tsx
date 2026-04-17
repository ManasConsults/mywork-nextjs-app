'use client';

import { ThemeProvider } from 'next-themes';

// SessionProvider is intentionally NOT here — keeping next-auth out of the root
// layout bundle prevents `/_not-found` (always pre-rendered, no force-dynamic)
// from triggering next-auth's new URL(NEXTAUTH_URL) at build time.
// SessionProvider is mounted in app/(app)/layout.tsx instead, which is
// force-dynamic and only renders at request time when env vars are present.
export function Providers({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  );
}
