'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Client } from '@prisma/client';

import { createInvoiceAction } from '@/lib/actions/finance/invoice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const TAX_RATES: { label: string; value: number }[] = [
  { label: '0%', value: 0 },
  { label: '5%', value: 500 },
  { label: '10%', value: 1000 },
  { label: '20%', value: 2000 },
];

interface PaymentAccount {
  id: string;
  name: string;
  bankName: string | null;
  accountNumber: string | null;
  bsb: string | null;
  iban: string | null;
  swiftBic: string | null;
}

interface InvoiceFormProps {
  clients: Client[];
  paymentAccounts: PaymentAccount[];
}

interface FieldErrors {
  clientId?: string[];
  paymentAccountId?: string[];
  issueDate?: string[];
  dueDate?: string[];
  taxRate?: string[];
  notes?: string[];
}

export function InvoiceForm({ clients, paymentAccounts }: InvoiceFormProps): React.JSX.Element {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rootError, setRootError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [clientId, setClientId] = useState('');
  const [paymentAccountId, setPaymentAccountId] = useState('');
  const [taxRate, setTaxRate] = useState('0');

  const today = new Date().toISOString().split('T')[0];

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const issueDateRaw = fd.get('issueDate') as string;
    const dueDateRaw = fd.get('dueDate') as string;
    const notes = (fd.get('notes') as string).trim() || undefined;

    const errors: FieldErrors = {};
    if (!clientId) errors.clientId = ['Please select a client'];
    if (!issueDateRaw) errors.issueDate = ['Issue date is required'];
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const input = {
      clientId,
      paymentAccountId: paymentAccountId || undefined,
      issueDate: new Date(issueDateRaw),
      dueDate: dueDateRaw ? new Date(dueDateRaw) : undefined,
      taxRate: parseInt(taxRate, 10),
      notes,
    };

    setFieldErrors({});
    setRootError(null);

    startTransition(async () => {
      const result = await createInvoiceAction(input);

      if (!result.success) {
        setRootError(result.error.message);
        if (result.error.fields) {
          setFieldErrors(result.error.fields as FieldErrors);
        }
        return;
      }

      router.push(`/finance/invoices/${result.data.id}`);
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
        <Label>Client <span className="text-red-500">*</span></Label>
        <Select value={clientId} onValueChange={setClientId} disabled={isPending}>
          <SelectTrigger aria-invalid={!!fieldErrors.clientId}>
            <SelectValue placeholder="Select a client" />
          </SelectTrigger>
          <SelectContent>
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {fieldErrors.clientId?.[0] && <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.clientId[0]}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>Payment Account</Label>
        <Select value={paymentAccountId} onValueChange={setPaymentAccountId} disabled={isPending}>
          <SelectTrigger aria-invalid={!!fieldErrors.paymentAccountId}>
            <SelectValue placeholder="None (no payment details on invoice)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_none">None (no payment details on invoice)</SelectItem>
            {paymentAccounts.map((a) => {
              const detail = [a.bankName, a.bsb, a.accountNumber, a.iban].filter(Boolean).join(' · ');
              return (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}{detail ? ` — ${detail}` : ''}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Payment details will appear on the PDF so clients know where to pay
        </p>
        {fieldErrors.paymentAccountId?.[0] && <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.paymentAccountId[0]}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="issueDate">Issue Date <span className="text-red-500">*</span></Label>
        <Input id="issueDate" name="issueDate" type="date" defaultValue={today} required disabled={isPending} aria-invalid={!!fieldErrors.issueDate} />
        {fieldErrors.issueDate?.[0] && <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.issueDate[0]}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="dueDate">Due Date</Label>
        <Input id="dueDate" name="dueDate" type="date" disabled={isPending} aria-invalid={!!fieldErrors.dueDate} />
        <p className="text-xs text-muted-foreground">Optional</p>
        {fieldErrors.dueDate?.[0] && <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.dueDate[0]}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>Tax Rate</Label>
        <Select value={taxRate} onValueChange={setTaxRate} disabled={isPending}>
          <SelectTrigger aria-invalid={!!fieldErrors.taxRate}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TAX_RATES.map((rate) => (
              <SelectItem key={rate.value} value={String(rate.value)}>{rate.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Tax is applied to the subtotal when the invoice is sent
        </p>
        {fieldErrors.taxRate?.[0] && <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.taxRate[0]}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={4} placeholder="Optional notes for the client" maxLength={2000} disabled={isPending} aria-invalid={!!fieldErrors.notes} />
        {fieldErrors.notes?.[0] && <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.notes[0]}</p>}
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={isPending || clients.length === 0}>
          {isPending ? 'Creating…' : 'Create Invoice'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push('/finance/invoices')}>
          Cancel
        </Button>
      </div>

      {clients.length === 0 && (
        <p className="text-sm text-amber-600 dark:text-amber-400">
          You need to{' '}
          <Link href="/finance/clients/new" className="underline">
            add a client
          </Link>{' '}
          before creating an invoice.
        </p>
      )}
    </form>
  );
}
