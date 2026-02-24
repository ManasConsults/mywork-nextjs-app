import type { Metadata } from 'next';

import { LoginForm } from './_components/LoginForm';

export const metadata: Metadata = {
  title: 'MyWork — Sign in',
};

export default function LoginPage(): JSX.Element {
  return <LoginForm />;
}
