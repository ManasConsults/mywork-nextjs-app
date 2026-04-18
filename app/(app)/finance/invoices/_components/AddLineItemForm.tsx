'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { addLineItemAction } from '@/lib/actions/finance/line-item';
import { toMinorUnit } from '@/lib/utils/money';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AddLineItemFormProps {
  invoiceId: string;
}

interface FieldErrors {
  description?: string[];
  quantity?: string[];
  unitPrice?: string[];
}

export function AddLineItemForm({ invoiceId }: AddLineItemFormProps): React.JSX.Element {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [rootError, setRootError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [sortOrder, setSortOrder] = useState(0);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const description = (fd.get('description') as string).trim();
    const quantity = parseFloat(fd.get('quantity') as string);
    const unitPriceDecimal = parseFloat(fd.get('unitPrice') as string);

    const errors: FieldErrors = {};
    if (!description) errors.description = ['Description is required'];
    if (isNaN(quantity) || quantity <= 0) errors.quantity = ['Quantity must be a positive number'];
    if (isNaN(unitPriceDecimal) || unitPriceDecimal <= 0) errors.unitPrice = ['Unit price must be a positive number'];

    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }

    setFieldErrors({});
    setRootError(null);

    startTransition(async () => {
      const result = await addLineItemAction(invoiceId, {
        description,
        quantity,
        unitPrice: toMinorUnit(unitPriceDecimal),
        sortOrder,
      });

      if (!result.success) {
        setRootError(result.error.message);
        if (result.error.fields) setFieldErrors(result.error.fields as FieldErrors);
        return;
      }

      formRef.current?.reset();
      setSortOrder((prev) => prev + 1);
      router.refresh();
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
      {rootError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {rootError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5 sm:col-span-1">
          <Label htmlFor="description">Description <span className="text-red-500">*</span></Label>
          <Input id="description" name="description" type="text" placeholder="Service description" maxLength={500} required disabled={isPending} aria-invalid={!!fieldErrors.description} />
          {fieldErrors.description?.[0] && <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.description[0]}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="quantity">Quantity <span className="text-red-500">*</span></Label>
          <Input id="quantity" name="quantity" type="number" step="0.01" min="0.01" placeholder="1.00" required disabled={isPending} aria-invalid={!!fieldErrors.quantity} />
          {fieldErrors.quantity?.[0] && <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.quantity[0]}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="unitPrice">Unit Price <span className="text-red-500">*</span></Label>
          <Input id="unitPrice" name="unitPrice" type="number" step="0.01" min="0.01" placeholder="0.00" required disabled={isPending} aria-invalid={!!fieldErrors.unitPrice} />
          {fieldErrors.unitPrice?.[0] && <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.unitPrice[0]}</p>}
        </div>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Adding…' : 'Add Line Item'}
      </Button>
    </form>
  );
}
