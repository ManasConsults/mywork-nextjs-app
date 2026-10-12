import type { Metadata } from 'next';
import Link from 'next/link';

import { LegalDocument } from '@/components/legal/LegalDocument';
import { APP_URL, CONTACT_EMAIL, OPERATOR_ABN, OPERATOR_NAME, TRADING_NAME } from '@/lib/legal/constants';

export const metadata: Metadata = { title: 'MyWork — Privacy Policy' };

export default function PrivacyPage(): React.JSX.Element {
  return (
    <LegalDocument title="Privacy Policy" showVersion>
      <p>
        This policy explains how MyWork ({APP_URL}) collects, uses, stores and discloses your personal
        information, and how you can access, correct or delete it. We handle personal information in line with
        the Privacy Act 1988 (Cth) and the Australian Privacy Principles (APPs).
      </p>

      <h2>1. Who we are</h2>
      <p>
        MyWork is operated by {OPERATOR_NAME}, a sole trader trading as {TRADING_NAME} (ABN: {OPERATOR_ABN}).
        In this policy, &ldquo;we&rdquo;, &ldquo;us&rdquo; and &ldquo;our&rdquo; mean {OPERATOR_NAME} trading as{' '}
        {TRADING_NAME}. You can contact us at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>

      <h2>2. Information we collect</h2>
      <ul>
        <li>
          <strong>Account details:</strong> your name, email address, a securely hashed password (if you
          register with a password), your employment type, and your preferences such as currency, fiscal year
          and theme colour.
        </li>
        <li>
          <strong>Sign-in provider details:</strong> if you sign in with Google, GitHub or Facebook, we receive
          your name, email address and profile picture from that provider. We do not receive your provider
          password.
        </li>
        <li>
          <strong>Content you create:</strong> tasks, work logs, achievements, notes, to-do items and, if you use
          the finance features, accounts, categories, transactions, clients, invoices and any business or bank
          details you choose to enter.
        </li>
        <li>
          <strong>Information about other people:</strong> if you record details of your clients or other
          people (for example names, email addresses and addresses on invoices), we store that information
          only on your behalf and use it only to provide MyWork to you.
        </li>
        <li>
          <strong>Feedback:</strong> anything you submit through the feedback form.
        </li>
        <li>
          <strong>Consent records:</strong> the date you accepted our Terms of Use and Privacy Policy and which
          version you accepted.
        </li>
        <li>
          <strong>Technical data:</strong> a session cookie (see section 7) and aggregated, cookieless usage and
          performance statistics.
        </li>
      </ul>

      <h2>3. How we collect it</h2>
      <p>
        We collect information directly from you when you register, sign in, use MyWork or contact us, and from
        your chosen sign-in provider when you use it to sign in.
      </p>

      <h2>4. Why we use it (APP 6)</h2>
      <p>We use your personal information only to:</p>
      <ul>
        <li>create and approve your account, authenticate you and keep your account secure;</li>
        <li>provide the features you use and store the content you create;</li>
        <li>send service emails, such as registration, approval and password reset messages;</li>
        <li>respond to your feedback and requests;</li>
        <li>monitor reliability and performance using aggregated statistics; and</li>
        <li>meet our legal obligations.</li>
      </ul>
      <p>
        We do not sell your personal information, and we do not use it for advertising or share it with third
        parties for their marketing.
      </p>

      <h2>5. Who we share it with, including overseas (APP 8)</h2>
      <p>
        We use the following service providers to run MyWork. They handle your information only to provide
        their service to us.
      </p>
      <ul>
        <li>
          <strong>Vercel</strong> (United States): application hosting, Vercel Analytics and Speed Insights.
        </li>
        <li>
          <strong>Neon</strong> (Sydney, Australia, region ap-southeast-2): our PostgreSQL database, where your
          account and content are stored.
        </li>
        <li>
          <strong>Resend</strong> (United States): delivery of service emails to your email address.
        </li>
        <li>
          <strong>Google, GitHub and Facebook</strong> (United States): only if you choose to sign in with them.
        </li>
      </ul>
      <p>
        Some of these providers are located in, or process data in, the United States, so your information may
        be disclosed to recipients overseas. Before disclosing information overseas we take reasonable steps to
        make sure the recipient handles it in a way that is consistent with the APPs, including by using
        providers that publish privacy and data protection terms. Other than as set out here, or where the law
        requires, we do not disclose your information to anyone else.
      </p>

      <h2>6. Content stays yours</h2>
      <p>
        Within the application, your tasks, work logs, notes, achievements, to-dos and finance records are
        visible only to you. Administrators of MyWork can:
      </p>
      <ul>
        <li>see your name, email address, role and account status, in order to approve, manage or remove accounts;</li>
        <li>see usage statistics, such as how many tasks or notes you have, but not what they contain; and</li>
        <li>read any feedback you choose to send through the feedback form.</li>
      </ul>
      <p>
        As the operator, we can technically access the database that stores your data. We do so only when it is
        needed to run or secure the service, to respond to a request from you, or where the law requires it.
      </p>

      <h2>7. Cookies</h2>
      <p>
        MyWork sets one cookie: the sign-in session cookie used by NextAuth.js. It is strictly necessary to keep
        you signed in and is removed when you sign out or it expires. Vercel Analytics does not use cookies. We
        do not use advertising or tracking cookies.
      </p>

      <h2>8. Security and retention (APP 11)</h2>
      <p>
        We take reasonable steps to protect your information from misuse, interference, loss and unauthorised
        access. Passwords are stored only as salted hashes, traffic is encrypted in transit, and access to the
        database is restricted. No online service can be guaranteed to be completely secure.
      </p>
      <p>
        We keep your information for as long as your account exists. When you ask us to delete your account,
        there is a 14-day grace period. During it your data is kept unchanged so you can change your mind, and
        we are notified of your request by email (sent through Resend, which receives only your account
        reference, not your content). After the 14-day period, your account and all of your content are
        permanently deleted from the live database by an administrator, within 30 days after that period
        ends. Until then your email address stays reserved. Our database provider keeps a short restore history for disaster
        recovery, so deleted data can remain there for up to 30 days after permanent deletion before it is
        removed. We do not restore deleted accounts from it.
      </p>
      <p>
        If a data breach is likely to result in serious harm to you, we will notify you and the Office of the
        Australian Information Commissioner (OAIC) as required by the Notifiable Data Breaches scheme.
      </p>

      <h2>9. Access and correction (APP 12 and 13)</h2>
      <p>
        You can view and update your details at any time under Profile. You can download a copy of your data
        from Profile &rarr; Account &rarr; Export my data. To ask for anything else, or to correct information
        you cannot change yourself, email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. We will
        respond within 30 days.
      </p>

      <h2>10. Deleting your data</h2>
      <p>
        You can ask to delete your account and data yourself from Profile &rarr; Account &rarr; Delete
        account. You are signed out straight away and cannot sign in or export your data afterwards, so export
        first if you want a copy. Your account is permanently deleted after a 14-day period, within 30 days after
        that period ends, and you can cancel before then by emailing us. If you cannot sign in, email us. Full steps are on the{' '}
        <Link href="/data-deletion">data deletion page</Link>.
      </p>

      <h2>11. Complaints</h2>
      <p>
        If you think we have breached the APPs, contact us at{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and we will investigate and reply within 30
        days. If you are not satisfied with our response, you can complain to the OAIC at{' '}
        <a href="https://www.oaic.gov.au" target="_blank" rel="noopener noreferrer">www.oaic.gov.au</a> or on
        1300 363 992.
      </p>

      <h2>12. Changes to this policy</h2>
      <p>
        We may update this policy from time to time. The version and date at the top of this page show when it
        last changed. If we make a material change, we will ask you to review and accept it the next time you
        use MyWork.
      </p>
    </LegalDocument>
  );
}
