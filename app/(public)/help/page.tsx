import type { Metadata } from 'next';
import Link from 'next/link';

import { LegalDocument } from '@/components/legal/LegalDocument';
import { features } from '@/components/marketing/features';
import { CONTACT_EMAIL } from '@/lib/legal/constants';

export const metadata: Metadata = { title: 'MyWork — Help' };

export default function HelpPage(): React.JSX.Element {
  return (
    <LegalDocument title="Help">
      <h2>Getting started</h2>
      <ol>
        <li>
          <Link href="/register">Create an account</Link> and accept the Terms of Use and Privacy Policy, or
          sign in with Google, GitHub or Facebook.
        </li>
        <li>
          Wait for approval. An administrator reviews every new account, and you can sign in once it is
          approved.
        </li>
        <li>
          <Link href="/login">Sign in</Link>. If you used a sign-in provider, you will be asked to accept the
          terms on your first visit.
        </li>
        <li>Pick the modules you need and start adding tasks, notes and records.</li>
      </ol>

      <h2>What you can do</h2>
      <ul className="list-none pl-0">
        {features.map((feature) => (
          <li key={feature.title} className="pl-0">
            <strong>{feature.title}.</strong> {feature.description} <em>{feature.how}</em>
          </li>
        ))}
      </ul>

      <h2>Your data</h2>
      <p>
        Export or delete your data any time from Profile &rarr; Account. See{' '}
        <Link href="/data-deletion">data deletion</Link> for details.
      </p>

      <h2>Need more help?</h2>
      <p>
        Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </LegalDocument>
  );
}
