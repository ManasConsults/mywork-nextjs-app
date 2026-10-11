'use client';

import { signOut } from 'next-auth/react';
import { useState, useTransition } from 'react';

import { deleteAccountAction } from '@/lib/actions/account';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function AccountDataSection({ hasPassword }: { hasPassword: boolean }): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(next: boolean): void {
    setOpen(next);
    if (!next) {
      setConfirmation('');
      setAcknowledged(false);
      setError(null);
    }
  }

  function handleDelete(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    if (!acknowledged) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteAccountAction({ confirmation, acknowledged });
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      await signOut({ callbackUrl: '/?accountDeleted=1' });
    });
  }

  const canSubmit = confirmation.trim().length > 0 && acknowledged && !isPending;

  return (
    <div className="mt-8 flex flex-col gap-6 border-t border-border pt-6">
      <section className="flex flex-col gap-2">
        <h3 className="text-base font-medium text-foreground">Export my data</h3>
        <p className="text-sm text-muted-foreground">
          Download everything MyWork holds about you, including items you have deleted, as a JSON file.
        </p>
        <div>
          <Button asChild variant="outline" className="min-h-11 border border-border">
            <a href="/api/account/export" download>Export my data</a>
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-base font-medium text-destructive">Delete account</h3>
        <p className="text-sm text-muted-foreground">
          Permanently deletes your account and all of your data. This cannot be undone. Export your data first
          if you need a copy, for example for your own tax record keeping.
        </p>
        <div>
          <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button variant="destructive" className="min-h-11">Delete account</Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleDelete} className="flex flex-col gap-4">
                <DialogHeader>
                  <DialogTitle>Delete your account?</DialogTitle>
                  <DialogDescription>
                    All of your tasks, notes, work logs, achievements, finance records and feedback will be
                    permanently erased. You will be signed out immediately.
                  </DialogDescription>
                </DialogHeader>

                {error && (
                  <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="deleteConfirmation">
                    {hasPassword ? 'Enter your password to confirm' : 'Type your email address to confirm'}
                  </Label>
                  <Input
                    id="deleteConfirmation"
                    type={hasPassword ? 'password' : 'email'}
                    autoComplete={hasPassword ? 'current-password' : 'email'}
                    value={confirmation}
                    onChange={(e) => setConfirmation(e.target.value)}
                    disabled={isPending}
                  />
                </div>

                <div className="flex min-h-11 items-center gap-3">
                  <Checkbox
                    id="deleteAcknowledged"
                    checked={acknowledged}
                    onCheckedChange={(checked) => setAcknowledged(checked === true)}
                    disabled={isPending}
                    className="size-5"
                  />
                  <Label htmlFor="deleteAcknowledged" className="text-sm font-normal leading-snug">
                    I understand this is permanent and cannot be undone.
                  </Label>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11 border border-border"
                    onClick={() => handleOpenChange(false)}
                    disabled={isPending}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="destructive" className="min-h-11" disabled={!canSubmit} aria-busy={isPending}>
                    {isPending ? 'Deleting…' : 'Delete my account'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </section>
    </div>
  );
}
