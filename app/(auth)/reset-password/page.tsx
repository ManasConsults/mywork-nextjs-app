import { Suspense } from 'react';
import type { Metadata } from 'next';

import { ResetPasswordForm } from './_components/ResetPasswordForm';

export const metadata: Metadata = {
  title: 'MyWork — Reset password',
};

export default function ResetPasswordPage(): React.JSX.Element {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
