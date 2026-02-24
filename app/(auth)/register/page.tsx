import type { Metadata } from 'next';

import { RegisterForm } from './_components/RegisterForm';

export const metadata: Metadata = {
  title: 'MyWork — Create account',
};

export default function RegisterPage(): JSX.Element {
  return <RegisterForm />;
}
