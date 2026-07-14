import type { Metadata } from 'next';

import { ForgotPasswordForm } from './_components/ForgotPasswordForm';

export const metadata: Metadata = {
  title: 'MyWork — Forgot password',
};

export default function ForgotPasswordPage(): React.JSX.Element {
  return <ForgotPasswordForm />;
}
