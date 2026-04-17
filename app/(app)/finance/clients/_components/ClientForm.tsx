'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Client } from '@prisma/client';

import { createClientAction, updateClientAction } from '@/lib/actions/finance/client';
import { toMinorUnit } from '@/lib/utils/money';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ClientFormProps {
  client?: Client;
}

interface FieldErrors {
  name?: string[];
  contactName?: string[];
  email?: string[];
  phone?: string[];
  address?: string[];
  defaultRate?: string[];
  notes?: string[];
}

export function ClientForm({ client }: ClientFormProps): React.JSX.Element {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rootError, setRootError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const isEdit = !!client;
  const defaultRateDisplay = client?.defaultRate != null ? (client.defaultRate / 100).toFixed(2) : '';

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const rateRaw = fd.get('defaultRate') as string;
    let defaultRate: number | undefined;
    if (rateRaw && rateRaw.trim() !== '') {
      const rateDecimal = parseFloat(rateRaw);
      if (isNaN(rateDecimal) || rateDecimal <= 0) {
        setFieldErrors({ defaultRate: ['Default rate must be a positive number'] });
        return;
      }
      defaultRate = toMinorUnit(rateDecimal);
    }

    const input = {
      name: (fd.get('name') as string).trim(),
      contactName: (fd.get('contactName') as string).trim() || undefined,
      email: (fd.get('email') as string).trim() || undefined,
      phone: (fd.get('phone') as string).trim() || undefined,
      address: (fd.get('address') as string).trim() || undefined,
      defaultRate,
      notes: (fd.get('notes') as string).trim() || undefined,
    };

    setFieldErrors({});
    setRootError(null);

    startTransition(async () => {
      const result = isEdit
        ? await updateClientAction(client.id, input)
        : await createClientAction(input);

      if (!result.success) {
        setRootError(result.error.message);
        if (result.error.fields) setFieldErrors(result.error.fields as FieldErrors);
        return;
      }

      if (isEdit) {
        router.refresh();
      } else {
        router.push('/finance/clients');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {rootError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {rootError}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="name">Name <span className="text-red-500">*</span></Label>
        <Input id="name" name="name" type="text" defaultValue={client?.name ?? ''} placeholder="e.g. Acme Corp" required disabled={isPending} aria-invalid={!!fieldErrors.name} />
        {fieldErrors.name?.[0] && <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.name[0]}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="contactName">Point of Contact</Label>
        <Input id="contactName" name="contactName" type="text" defaultValue={client?.contactName ?? ''} placeholder="e.g. Jane Smith" disabled={isPending} aria-invalid={!!fieldErrors.contactName} />
        {fieldErrors.contactName?.[0] && <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.contactName[0]}</p>}
        <p className="text-xs text-muted-foreground">The person invoices are addressed to at this business.</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" defaultValue={client?.email ?? ''} placeholder="e.g. billing@acme.com" disabled={isPending} aria-invalid={!!fieldErrors.email} />
        {fieldErrors.email?.[0] && <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.email[0]}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" type="tel" defaultValue={client?.phone ?? ''} placeholder="e.g. +44 7700 900000" disabled={isPending} aria-invalid={!!fieldErrors.phone} />
        {fieldErrors.phone?.[0] && <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.phone[0]}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="address">Address</Label>
        <Textarea id="address" name="address" defaultValue={client?.address ?? ''} rows={3} placeholder="Billing address (optional)" disabled={isPending} aria-invalid={!!fieldErrors.address} />
        {fieldErrors.address?.[0] && <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.address[0]}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="defaultRate">Default Hourly Rate</Label>
        <Input id="defaultRate" name="defaultRate" type="number" step="0.01" min="0.01" defaultValue={defaultRateDisplay} placeholder="e.g. 75.00" disabled={isPending} aria-invalid={!!fieldErrors.defaultRate} />
        {fieldErrors.defaultRate?.[0] && <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.defaultRate[0]}</p>}
        <p className="text-xs text-muted-foreground">Enter the hourly rate as a decimal, e.g. 75.00</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" defaultValue={client?.notes ?? ''} rows={4} placeholder="Internal notes about this client (optional)" disabled={isPending} aria-invalid={!!fieldErrors.notes} />
        {fieldErrors.notes?.[0] && <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.notes[0]}</p>}
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Create client'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push('/finance/clients')}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
