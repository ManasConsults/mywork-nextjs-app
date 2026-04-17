export const dynamic = 'force-dynamic';

interface PrintLayoutProps {
  children: React.ReactNode;
}

export default function PrintLayout({ children }: PrintLayoutProps): React.JSX.Element {
  return <>{children}</>;
}
