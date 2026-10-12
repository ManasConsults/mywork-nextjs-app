import type { Metadata } from 'next';
import Link from 'next/link';

import { LegalDocument } from '@/components/legal/LegalDocument';
import { CONTACT_EMAIL } from '@/lib/legal/constants';

export const metadata: Metadata = { title: 'MyWork — Data deletion' };

const REQUEST_SUBJECT = 'Data deletion request';
const CANCEL_SUBJECT = 'Cancel account deletion';

export default function DataDeletionPage(): React.JSX.Element {
  return (
    <LegalDocument title="Delete your MyWork data">
      <p>
        You can ask us to permanently delete your MyWork account and all the data in it at any time. This
        applies to everyone, including people who signed in with Google, GitHub or Facebook. Your account is
        permanently deleted after a 14-day period, within 30 days after that period ends, and you can cancel
        any time before it is deleted.
      </p>

      <h2>Option 1: delete it yourself in the app</h2>
      <ol>
        <li>
          <Link href="/login">Sign in</Link> to MyWork.
        </li>
        <li>Open <strong>Profile</strong> and select the <strong>Account</strong> tab.</li>
        <li>
          Optional but recommended: choose <strong>Export my data</strong> to download a copy first.
        </li>
        <li>Choose <strong>Delete account</strong>.</li>
        <li>
          Confirm with your password (or, if you signed in with a provider, by typing your email address), tick
          the box to confirm you understand, and select <strong>Delete my account</strong>.
        </li>
      </ol>
      <p>
        You are signed out straight away and cannot sign in or export your data from then on, so export first.
        Your account is permanently deleted after a 14-day period, within 30 days after that period ends. If you are the only administrator, you
        must promote another user to Admin first.
      </p>

      <h2>Changing your mind</h2>
      <p>
        To cancel before your account is deleted, email{' '}
        <a href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(CANCEL_SUBJECT)}`}>{CONTACT_EMAIL}</a> with
        the subject <strong>{CANCEL_SUBJECT}</strong>, from the email address on your account. Until your account
        is deleted, that email address stays reserved and cannot be used to register again.
      </p>

      <h2>Option 2: ask us by email</h2>
      <p>
        If you cannot sign in, for example because your account was never approved, or you only use Facebook
        and prefer not to sign in again, email{' '}
        <a href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(REQUEST_SUBJECT)}`}>{CONTACT_EMAIL}</a>{' '}
        with the subject <strong>{REQUEST_SUBJECT}</strong>. Send it from the email address on your account so
        we can verify it is yours. We will respond within 30 days.
      </p>

      <h2>What happens to a copy</h2>
      <p>
        After your account is permanently deleted, a copy may remain in our database provider&rsquo;s
        disaster-recovery history for up to 30 days. We do not restore deleted accounts from it.
      </p>

      <h2>What is deleted</h2>
      <p>
        Your profile, sign-in details and all content you created: tasks, work logs, achievements, notes,
        to-dos, finance records (accounts, categories, transactions, clients and invoices) and feedback,
        including anything you previously deleted.
      </p>

      <h2>Before you delete</h2>
      <ul>
        <li>
          Once your account has been permanently deleted, it cannot be undone. We cannot recover your data
          afterwards.
        </li>
        <li>
          If you need to keep business or tax records, export your data first. You are responsible for keeping
          your own records, for example for the Australian Taxation Office&rsquo;s five-year requirement.
        </li>
        <li>
          Removing MyWork from your Facebook, Google or GitHub account settings does not delete your data in
          MyWork. Use one of the options above.
        </li>
      </ul>
      <p>
        More detail on how we handle your information is in the <Link href="/privacy">Privacy Policy</Link>.
      </p>
    </LegalDocument>
  );
}
