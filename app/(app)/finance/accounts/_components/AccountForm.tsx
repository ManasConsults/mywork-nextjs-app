'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Account } from '@prisma/client';

import { createAccountAction, updateAccountAction } from '@/lib/actions/finance/account';
import { toMinorUnit } from '@/lib/utils/money';
import { useFinance } from '@/app/(app)/finance/_components/FinanceProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  CHECKING: 'Checking',
  SAVINGS: 'Savings',
  CASH: 'Cash',
  CREDIT: 'Credit',
  INVESTMENT: 'Investment',
};

const ACCOUNT_TYPES = ['CHECKING', 'SAVINGS', 'CASH', 'CREDIT', 'INVESTMENT'] as const;
type AccountType = (typeof ACCOUNT_TYPES)[number];

function isAccountType(value: string): value is AccountType {
  return (ACCOUNT_TYPES as readonly string[]).includes(value);
}

interface AccountFormProps {
  account?: Account;
}

interface FieldErrors {
  name?: string[];
  type?: string[];
  openingBalance?: string[];
  description?: string[];
  isDefault?: string[];
}

export function AccountForm({ account }: AccountFormProps): React.JSX.Element {
  const { currency } = useFinance();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rootError, setRootError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [accountType, setAccountType] = useState(account?.type ?? 'CHECKING');

  const isEdit = !!account;
  const defaultBalance = account?.openingBalance != null ? (account.openingBalance / 100).toFixed(2) : '0.00';

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const balanceRaw = fd.get('openingBalance') as string;
    const balanceDecimal = parseFloat(balanceRaw || '0');
    if (isNaN(balanceDecimal) || balanceDecimal < 0) {
      setFieldErrors({ openingBalance: ['Opening balance must be a non-negative number'] });
      return;
    }

    if (!isAccountType(accountType)) {
      setFieldErrors({ type: ['Invalid account type selected'] });
      return;
    }

    const input = {
      name: (fd.get('name') as string).trim(),
      type: accountType,
      openingBalance: toMinorUnit(balanceDecimal),
      currency,
      description: (fd.get('description') as string).trim() || undefined,
      isDefault: fd.get('isDefault') === 'on',
      bankName: (fd.get('bankName') as string).trim() || undefined,
      accountNumber: (fd.get('accountNumber') as string).trim() || undefined,
      bsb: (fd.get('bsb') as string).trim() || undefined,
      iban: (fd.get('iban') as string).trim() || undefined,
      swiftBic: (fd.get('swiftBic') as string).trim() || undefined,
    };

    setFieldErrors({});
    setRootError(null);

    startTransition(async () => {
      const result = isEdit
        ? await updateAccountAction(account.id, input)
        : await createAccountAction(input);

      if (!result.success) {
        setRootError(result.error.message);
        if (result.error.fields) setFieldErrors(result.error.fields as FieldErrors);
        return;
      }
      router.push('/finance/accounts');
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {rootError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {rootError}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Account name <span className="text-red-500">*</span></Label>
        <Input id="name" name="name" type="text" defaultValue={account?.name ?? ''} placeholder="e.g. Main Current Account" required disabled={isPending} aria-invalid={!!fieldErrors.name} />
        {fieldErrors.name?.[0] && <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.name[0]}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Account type <span className="text-red-500">*</span></Label>
        <Select value={accountType} onValueChange={(v) => setAccountType(v as typeof accountType)} disabled={isPending}>
          <SelectTrigger aria-invalid={!!fieldErrors.type}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ACCOUNT_TYPES.map((t) => (
              <SelectItem key={t} value={t}>{ACCOUNT_TYPE_LABELS[t]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {fieldErrors.type?.[0] && <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.type[0]}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="openingBalance">Opening balance</Label>
        <Input id="openingBalance" name="openingBalance" type="number" step="0.01" min="0" defaultValue={defaultBalance} placeholder="0.00" disabled={isPending} aria-invalid={!!fieldErrors.openingBalance} />
        {fieldErrors.openingBalance?.[0] && <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.openingBalance[0]}</p>}
        <p className="text-xs text-muted-foreground">Enter the starting balance as a decimal, e.g. 1250.00</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" defaultValue={account?.description ?? ''} rows={3} placeholder="Optional description" disabled={isPending} aria-invalid={!!fieldErrors.description} />
        {fieldErrors.description?.[0] && <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.description[0]}</p>}
      </div>

      <div className="rounded-lg border border-border bg-muted/50 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Payment details (shown on invoices)
        </p>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bankName">Bank name</Label>
            <Input id="bankName" name="bankName" type="text" maxLength={100} defaultValue={account?.bankName ?? ''} placeholder="e.g. Commonwealth Bank" disabled={isPending} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bsb">BSB</Label>
              <Input id="bsb" name="bsb" type="text" maxLength={20} defaultValue={account?.bsb ?? ''} placeholder="e.g. 062-000" disabled={isPending} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="accountNumber">Account number</Label>
              <Input id="accountNumber" name="accountNumber" type="text" maxLength={50} defaultValue={account?.accountNumber ?? ''} placeholder="e.g. 12345678" disabled={isPending} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="iban">IBAN</Label>
            <Input id="iban" name="iban" type="text" maxLength={34} defaultValue={account?.iban ?? ''} placeholder="e.g. GB29NWBK60161331926819" disabled={isPending} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="swiftBic">SWIFT / BIC</Label>
            <Input id="swiftBic" name="swiftBic" type="text" maxLength={11} defaultValue={account?.swiftBic ?? ''} placeholder="e.g. BARCGB22" disabled={isPending} />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <input
          id="isDefault"
          name="isDefault"
          type="checkbox"
          defaultChecked={account?.isDefault ?? false}
          className="size-4 rounded border-border text-primary focus:ring-ring"
        />
        <Label htmlFor="isDefault">Set as default account</Label>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : 'Save account'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push('/finance/accounts')}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
