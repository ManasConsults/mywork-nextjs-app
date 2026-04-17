'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Account, Category, Transaction } from '@prisma/client';

import { createTransactionAction, updateTransactionAction } from '@/lib/actions/finance/transaction';
import { createTransactionSchema, updateTransactionSchema } from '@/lib/schemas/finance/transaction.schema';
import { toMinorUnit } from '@/lib/utils/money';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type TransactionWithRelations = Transaction & {
  account: { name: string };
  category: { name: string; type: string };
};

const TRANSACTION_TYPES = [
  { value: 'INCOME', label: 'Income' },
  { value: 'EXPENSE', label: 'Expense' },
  { value: 'TRANSFER_OUT', label: 'Transfer Out' },
  { value: 'TRANSFER_IN', label: 'Transfer In' },
] as const;

type TxType = (typeof TRANSACTION_TYPES)[number]['value'];

const WORK_CONTEXT_OPTIONS = [
  { value: 'EMPLOYED', label: 'Day Job' },
  { value: 'SOLE_TRADER', label: 'Sole Trading' },
] as const;

interface FieldErrors {
  type?: string[];
  accountId?: string[];
  amount?: string[];
  date?: string[];
  categoryId?: string[];
  description?: string[];
  reference?: string[];
  workContext?: string[];
  transferToAccountId?: string[];
  recurFrequency?: string[];
  recurEndsAt?: string[];
}

interface TransactionFormProps {
  transaction?: TransactionWithRelations;
  accounts: Account[];
  categories: Category[];
  employmentType: string;
}

function todayIso(): string {
  return new Date().toISOString().split('T')[0];
}

export function TransactionForm({
  transaction,
  accounts,
  categories,
  employmentType,
}: TransactionFormProps): React.JSX.Element {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rootError, setRootError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const isEdit = !!transaction;
  const showWorkContext = employmentType === 'BOTH';

  const [isRecurring, setIsRecurring] = useState(false);
  const [selectedFrequency, setSelectedFrequency] = useState('MONTHLY');
  const [selectedType, setSelectedType] = useState<TxType>((transaction?.type as TxType) ?? 'EXPENSE');
  const [accountId, setAccountId] = useState(transaction?.accountId ?? '');
  const [categoryId, setCategoryId] = useState(transaction?.categoryId ?? '');
  const [transferToAccountId, setTransferToAccountId] = useState('');
  const [workContext, setWorkContext] = useState(transaction?.workContext ?? '');

  const showTransferDest = selectedType === 'TRANSFER_OUT';
  const defaultDate = transaction?.date ? new Date(transaction.date).toISOString().split('T')[0] : todayIso();
  const defaultAmountDecimal = transaction?.amount != null ? (transaction.amount / 100).toFixed(2) : '';

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const amountDecimal = parseFloat(fd.get('amount') as string);
    if (isNaN(amountDecimal) || amountDecimal <= 0) {
      setFieldErrors({ amount: ['Amount must be a positive number, e.g. 12.50'] });
      return;
    }

    const raw = {
      type: selectedType,
      accountId,
      categoryId,
      amount: toMinorUnit(amountDecimal),
      date: fd.get('date') as string,
      description: (fd.get('description') as string).trim() || undefined,
      reference: (fd.get('reference') as string).trim() || undefined,
      workContext: showWorkContext && workContext ? (workContext as 'EMPLOYED' | 'SOLE_TRADER') : undefined,
      transferToAccountId: selectedType === 'TRANSFER_OUT' ? transferToAccountId || undefined : undefined,
      isRecurring: !isEdit && isRecurring ? true : undefined,
      recurFrequency: !isEdit && isRecurring ? (selectedFrequency as 'WEEKLY' | 'FORTNIGHTLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY') : undefined,
      recurEndsAt: !isEdit && isRecurring ? ((fd.get('recurEndsAt') as string) || undefined) : undefined,
    };

    if (isEdit) {
      const parsed = updateTransactionSchema.safeParse(raw);
      if (!parsed.success) { setFieldErrors(parsed.error.flatten().fieldErrors as FieldErrors); return; }
      setFieldErrors({}); setRootError(null);
      startTransition(async () => {
        const result = await updateTransactionAction(transaction.id, parsed.data);
        if (!result.success) { setRootError(result.error.message); if (result.error.fields) setFieldErrors(result.error.fields as FieldErrors); return; }
        router.push('/finance/transactions');
      });
    } else {
      const parsed = createTransactionSchema.safeParse(raw);
      if (!parsed.success) { setFieldErrors(parsed.error.flatten().fieldErrors as FieldErrors); return; }
      setFieldErrors({}); setRootError(null);
      startTransition(async () => {
        const result = await createTransactionAction(parsed.data);
        if (!result.success) { setRootError(result.error.message); if (result.error.fields) setFieldErrors(result.error.fields as FieldErrors); return; }
        router.push('/finance/transactions');
      });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {rootError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {rootError}
        </div>
      )}

      {isEdit && transaction?.isRecurring && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary">
          This is a recurring transaction template. Edits apply to this occurrence only.
        </div>
      )}

      <div className="space-y-1.5">
        <Label>Type <span className="text-red-500">*</span></Label>
        <Select value={selectedType} onValueChange={(v) => setSelectedType(v as TxType)} disabled={isPending}>
          <SelectTrigger aria-invalid={!!fieldErrors.type}><SelectValue /></SelectTrigger>
          <SelectContent>
            {TRANSACTION_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
        {fieldErrors.type?.[0] && <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.type[0]}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>Account <span className="text-red-500">*</span></Label>
        <Select value={accountId} onValueChange={setAccountId} disabled={isPending}>
          <SelectTrigger aria-invalid={!!fieldErrors.accountId}><SelectValue placeholder="Select an account…" /></SelectTrigger>
          <SelectContent>
            {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
          </SelectContent>
        </Select>
        {fieldErrors.accountId?.[0] && <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.accountId[0]}</p>}
      </div>

      {showTransferDest && (
        <div className="space-y-1.5">
          <Label>Transfer to account <span className="text-red-500">*</span></Label>
          <Select value={transferToAccountId} onValueChange={setTransferToAccountId} disabled={isPending}>
            <SelectTrigger aria-invalid={!!fieldErrors.transferToAccountId}><SelectValue placeholder="Select destination account…" /></SelectTrigger>
            <SelectContent>
              {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {fieldErrors.transferToAccountId?.[0] && <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.transferToAccountId[0]}</p>}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="amount">Amount <span className="text-red-500">*</span></Label>
        <Input id="amount" name="amount" type="number" step="0.01" min="0.01" defaultValue={defaultAmountDecimal} placeholder="0.00" disabled={isPending} aria-invalid={!!fieldErrors.amount} />
        {fieldErrors.amount?.[0] && <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.amount[0]}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="date">Date <span className="text-red-500">*</span></Label>
        <Input id="date" name="date" type="date" defaultValue={defaultDate} disabled={isPending} aria-invalid={!!fieldErrors.date} />
        {fieldErrors.date?.[0] && <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.date[0]}</p>}
      </div>

      {!isEdit && (
        <div className="rounded-lg border border-border bg-muted/50 p-4">
          <label className="flex cursor-pointer items-center gap-3">
            <input type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} className="h-4 w-4 rounded border-border text-primary focus:ring-ring" />
            <span className="text-sm font-medium text-foreground">Make this a recurring transaction</span>
          </label>

          {isRecurring && (
            <div className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <Label>Frequency <span className="text-red-500">*</span></Label>
                <Select value={selectedFrequency} onValueChange={setSelectedFrequency} disabled={isPending}>
                  <SelectTrigger aria-invalid={!!fieldErrors.recurFrequency}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WEEKLY">Weekly</SelectItem>
                    <SelectItem value="FORTNIGHTLY">Fortnightly</SelectItem>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                    <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                    <SelectItem value="ANNUALLY">Annually</SelectItem>
                  </SelectContent>
                </Select>
                {fieldErrors.recurFrequency?.[0] && <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.recurFrequency[0]}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="recurEndsAt">Repeat until (optional)</Label>
                <Input id="recurEndsAt" name="recurEndsAt" type="date" min={todayIso()} disabled={isPending} aria-invalid={!!fieldErrors.recurEndsAt} />
                <p className="text-xs text-muted-foreground">Leave blank to repeat indefinitely.</p>
                {fieldErrors.recurEndsAt?.[0] && <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.recurEndsAt[0]}</p>}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="space-y-1.5">
        <Label>Category <span className="text-red-500">*</span></Label>
        <Select value={categoryId} onValueChange={setCategoryId} disabled={isPending}>
          <SelectTrigger aria-invalid={!!fieldErrors.categoryId}><SelectValue placeholder="Select a category…" /></SelectTrigger>
          <SelectContent>
            {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        {fieldErrors.categoryId?.[0] && <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.categoryId[0]}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description (optional)</Label>
        <Input id="description" name="description" type="text" defaultValue={transaction?.description ?? ''} placeholder="e.g. Weekly groceries" maxLength={500} disabled={isPending} />
        {fieldErrors.description?.[0] && <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.description[0]}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="reference">Reference (optional)</Label>
        <Input id="reference" name="reference" type="text" defaultValue={transaction?.reference ?? ''} placeholder="e.g. INV-0042" maxLength={100} disabled={isPending} />
        {fieldErrors.reference?.[0] && <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.reference[0]}</p>}
      </div>

      {showWorkContext && (
        <div className="space-y-1.5">
          <Label>Work context (optional)</Label>
          <Select value={workContext} onValueChange={setWorkContext} disabled={isPending}>
            <SelectTrigger aria-invalid={!!fieldErrors.workContext}><SelectValue placeholder="Not specified" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">Not specified</SelectItem>
              {WORK_CONTEXT_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
          {fieldErrors.workContext?.[0] && <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.workContext[0]}</p>}
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Create transaction'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push('/finance/transactions')}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
