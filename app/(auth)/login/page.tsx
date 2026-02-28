import { Suspense } from 'react';
import type { Metadata } from 'next';

import { LoginForm } from './_components/LoginForm';

export const metadata: Metadata = {
  title: 'MyWork — Sign in',
};

export default function LoginPage(): React.JSX.Element {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
