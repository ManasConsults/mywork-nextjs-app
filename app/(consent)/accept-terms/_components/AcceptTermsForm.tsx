'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useState, useTransition } from 'react';

import { acceptTermsAction } from '@/lib/actions/consent';
import { Button } from '@/components/ui/button';

export function AcceptTermsForm(): React.JSX.Element {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleAccept(): void {
    setError(null);
    startTransition(async () => {
      const result = await acceptTermsAction();
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      router.push('/dashboard');
      router.refresh();
    });
  }

  return (
    <div>
      <h1 className="mb-2 text-xl font-semibold text-foreground">Before you continue</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Please review and accept our{' '}
        <Link href="/terms" target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
          Terms of Use
        </Link>{' '}
        and{' '}
        <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
          Privacy Policy
        </Link>{' '}
        to use MyWork.
      </p>

      {error && (
        <div role="alert" className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Button type="button" size="lg" onClick={handleAccept} disabled={isPending} aria-busy={isPending} className="w-full">
          {isPending ? 'Saving…' : 'I accept'}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => signOut({ callbackUrl: '/login' })}
          disabled={isPending}
          className="w-full border border-border"
        >
          Decline and sign out
        </Button>
      </div>
    </div>
  );
}
