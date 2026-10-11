import type { Metadata } from 'next';
import Link from 'next/link';

import { LegalDocument } from '@/components/legal/LegalDocument';
import {
  CONTACT_EMAIL,
  GOVERNING_LAW,
  OPERATOR_ABN,
  OPERATOR_NAME,
  TRADING_NAME,
} from '@/lib/legal/constants';

export const metadata: Metadata = { title: 'MyWork — Terms of Use' };

export default function TermsPage(): React.JSX.Element {
  return (
    <LegalDocument title="Terms of Use" showVersion>
      <p>
        These terms govern your use of MyWork. MyWork is operated by {OPERATOR_NAME}, a sole trader trading as{' '}
        {TRADING_NAME} (ABN: {OPERATOR_ABN}). By creating an account or signing in, you agree to these terms
        and to our <Link href="/privacy">Privacy Policy</Link>.
      </p>

      <h2>1. Eligibility and account approval</h2>
      <p>
        You must be at least 18 years old and able to enter a binding contract. New accounts are reviewed and
        must be approved by an administrator before you can sign in. We may decline to approve a new account
        at our discretion. Once approved, your access can only be suspended or ended as set out in section 10.
      </p>

      <h2>2. Cost</h2>
      <p>
        MyWork is currently provided free of charge. If we decide to introduce fees, we will tell you at least
        30 days beforehand, and you can choose to export your data and delete your account instead.
      </p>

      <h2>3. Your account</h2>
      <p>
        Keep your password and sign-in provider account secure. You are responsible for activity under your
        account. Tell us promptly at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> if you suspect
        unauthorised use. Provide accurate information and keep it up to date.
      </p>

      <h2>4. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>break the law or infringe anyone&rsquo;s rights using MyWork;</li>
        <li>upload malicious code or attempt to disrupt, probe or overload the service;</li>
        <li>try to access another user&rsquo;s account or data;</li>
        <li>use automated means to scrape or bulk-access the service, other than your own data export; or</li>
        <li>use MyWork to store content that is unlawful, defamatory or harmful.</li>
      </ul>

      <h2>5. Your content</h2>
      <p>
        You own the content you put into MyWork. You give us a limited, non-exclusive licence to host, store,
        process and display that content solely to operate and provide the service to you. We do not claim any
        other rights over it.
      </p>
      <p>
        If you enter personal information about other people, such as your clients&rsquo; names and contact
        details, you are responsible for having their permission or another lawful basis to do so. We store it
        only on your behalf, as described in our <Link href="/privacy">Privacy Policy</Link>.
      </p>

      <h2>6. Not financial or tax advice</h2>
      <p>
        MyWork&rsquo;s finance, invoicing and reporting features are record-keeping tools. They are not
        financial, accounting, legal or tax advice. You are responsible for checking that your records and any
        figures are accurate and suitable for your needs, and for seeking professional advice where
        appropriate.
      </p>

      <h2>7. Export your data and keep your records</h2>
      <p>
        You can export your data at any time from Profile &rarr; Account. Once you ask to delete your account
        you are signed out immediately and cannot export, so export first. Your account is then permanently
        deleted after a 14-day grace period, within 30 days after that period ends. You can cancel before it is deleted by emailing{' '}
        <a href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Cancel account deletion')}`}>
          {CONTACT_EMAIL}
        </a>{' '}
        with the subject &ldquo;Cancel account deletion&rdquo;; once it is deleted it cannot be undone. If you need to keep business or tax records, for
        example the five years that the Australian Taxation Office generally requires, you are responsible for
        keeping your own copies. We do not act as your record keeper.
      </p>

      <h2>8. Availability</h2>
      <p>
        We aim to keep MyWork running but provide it on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo;
        basis. We may change, suspend or withdraw features, and the service may be unavailable from time to time
        for maintenance or reasons outside our control.
      </p>

      <h2>9. Consumer guarantees and liability</h2>
      <p>
        Nothing in these terms excludes, restricts or modifies any right or remedy, or any guarantee, warranty
        or other term, that you have under the Australian Consumer Law or any other law that cannot be excluded.
      </p>
      <p>
        Subject to that, and to the extent the law allows, we are not liable for indirect or consequential loss
        or loss of profit, and we are not liable for loss of data except to the extent it is caused by our
        failure to take reasonable care. Our total liability to you for any claim relating to MyWork is
        limited to resupplying the service or the cost of doing so. This is in addition to the protections
        above, not instead of them.
      </p>

      <h2>10. Suspension and termination</h2>
      <p>
        You can stop using MyWork and ask to delete your account at any time; it is permanently deleted after the
        14-day grace period described in section 7, within 30 days after that period ends. We may suspend or end your access if you
        breach these terms, if your use puts the service or other users at risk, or if we stop offering the
        service. Except where we need to act immediately to protect the service, other users or comply with the
        law, we will give you at least 30 days&rsquo; notice and a chance to export your data first.
      </p>

      <h2>11. Changes to these terms</h2>
      <p>
        We may update these terms. The version and date at the top of this page show when they last changed. If
        we make a material change, we will ask you to review and accept the new terms the next time you use
        MyWork. If you do not accept, you can delete your account.
      </p>

      <h2>12. Governing law</h2>
      <p>
        These terms are governed by the laws of {GOVERNING_LAW}. You and we submit to the non-exclusive
        jurisdiction of the courts of that place.
      </p>

      <h2>13. Contact</h2>
      <p>
        Questions about these terms: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </LegalDocument>
  );
}
