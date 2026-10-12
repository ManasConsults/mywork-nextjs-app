import type { Metadata } from 'next';
import Link from 'next/link';

import { LegalDocument } from '@/components/legal/LegalDocument';
import { CONTACT_EMAIL, OPERATOR_NAME, TRADING_NAME } from '@/lib/legal/constants';

export const metadata: Metadata = { title: 'MyWork — About' };

export default function AboutPage(): React.JSX.Element {
  return (
    <LegalDocument title="About MyWork">
      <p>
        MyWork is a personal work management app. It brings your tasks, work logs, achievements, notes and daily
        to-dos together in one place, with optional finance tools for people who work for themselves: accounts,
        transactions, clients, invoices and tax summaries.
      </p>

      <h2>Who runs it</h2>
      <p>
        MyWork is built and run by {OPERATOR_NAME}, a sole trader in Queensland, Australia, trading as{' '}
        {TRADING_NAME}. It is designed for Australian users.
      </p>

      <h2>Get in touch</h2>
      <p>
        Questions, feedback or requests: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
      <p>
        See also the <Link href="/privacy">Privacy Policy</Link>, <Link href="/terms">Terms of Use</Link> and{' '}
        <Link href="/help">Help</Link>.
      </p>
    </LegalDocument>
  );
}
