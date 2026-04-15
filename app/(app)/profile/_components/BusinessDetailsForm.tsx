'use client';

import { useState, useTransition } from 'react';

import { updateBusinessDetailsAction } from '@/lib/actions/user';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface BusinessDetailsFormProps {
  initialBusinessName: string | null;
  initialAbn: string | null;
  initialBusinessEmail: string | null;
  initialBusinessPhone: string | null;
  initialBusinessAddress: string | null;
}

export function BusinessDetailsForm({
  initialBusinessName,
  initialAbn,
  initialBusinessEmail,
  initialBusinessPhone,
  initialBusinessAddress,
}: BusinessDetailsFormProps): React.JSX.Element {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fields, setFields] = useState({
    businessName: initialBusinessName ?? '',
    abn: initialAbn ?? '',
    businessEmail: initialBusinessEmail ?? '',
    businessPhone: initialBusinessPhone ?? '',
    businessAddress: initialBusinessAddress ?? '',
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void {
    setFields((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setSuccess(false);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await updateBusinessDetailsAction({
        businessName: fields.businessName || null,
        abn: fields.abn || null,
        businessEmail: fields.businessEmail || null,
        businessPhone: fields.businessPhone || null,
        businessAddress: fields.businessAddress || null,
      });

      if (!result.success) {
        setError(result.error.message);
      } else {
        setSuccess(true);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-md border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary">
          Business details saved.
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="businessName">Business / Trading Name</Label>
        <Input
          id="businessName"
          name="businessName"
          type="text"
          maxLength={200}
          value={fields.businessName}
          onChange={handleChange}
          placeholder="e.g. Acme Consulting"
          disabled={isPending}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="abn">ABN</Label>
        <Input
          id="abn"
          name="abn"
          type="text"
          maxLength={20}
          value={fields.abn}
          onChange={handleChange}
          placeholder="e.g. 12 345 678 901"
          disabled={isPending}
        />
        <p className="text-xs text-muted-foreground">Australian Business Number — included on invoices</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="businessEmail">Business Email</Label>
        <Input
          id="businessEmail"
          name="businessEmail"
          type="email"
          maxLength={254}
          value={fields.businessEmail}
          onChange={handleChange}
          placeholder="billing@yourbusiness.com"
          disabled={isPending}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="businessPhone">Phone / Contact</Label>
        <Input
          id="businessPhone"
          name="businessPhone"
          type="tel"
          maxLength={30}
          value={fields.businessPhone}
          onChange={handleChange}
          placeholder="+61 4xx xxx xxx"
          disabled={isPending}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="businessAddress">Business Address</Label>
        <Textarea
          id="businessAddress"
          name="businessAddress"
          rows={3}
          maxLength={500}
          value={fields.businessAddress}
          onChange={handleChange}
          placeholder="Street, City, State, Postcode"
          disabled={isPending}
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : 'Save details'}
        </Button>
      </div>
    </form>
  );
}
