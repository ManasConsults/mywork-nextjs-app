import type { ReactNode } from 'react';

import { LEGAL_LAST_UPDATED, LEGAL_VERSION } from '@/lib/legal/constants';

interface LegalDocumentProps {
  title: string;
  /** Legal documents carry a version stamp; informational pages (about, help) do not. */
  showVersion?: boolean;
  children: ReactNode;
}

export function LegalDocument({ title, showVersion = false, children }: LegalDocumentProps): React.JSX.Element {
  return (
    <article>
      <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
      {showVersion && (
        <p className="mt-1 text-xs text-muted-foreground">
          Version {LEGAL_VERSION} &middot; Last updated {LEGAL_LAST_UPDATED}
        </p>
      )}
      <div className="prose prose-sm mt-6 max-w-none dark:prose-invert prose-headings:text-foreground prose-h2:mt-8 prose-h2:text-base prose-h2:font-medium prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
        {children}
      </div>
    </article>
  );
}
