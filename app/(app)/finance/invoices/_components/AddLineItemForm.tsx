'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { addLineItemAction } from '@/lib/actions/finance/line-item';
import { toMinorUnit } from '@/lib/utils/money';

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

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const description = (fd.get('description') as string).trim();
    const quantityRaw = fd.get('quantity') as string;
    const unitPriceRaw = fd.get('unitPrice') as string;

    const errors: FieldErrors = {};
    if (!description) errors.description = ['Description is required'];

    const quantity = parseFloat(quantityRaw);
    if (isNaN(quantity) || quantity <= 0) errors.quantity = ['Quantity must be a positive number'];

    const unitPriceDecimal = parseFloat(unitPriceRaw);
    if (isNaN(unitPriceDecimal) || unitPriceDecimal <= 0)
      errors.unitPrice = ['Unit price must be a positive number'];

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const input = {
      description,
      quantity,
      unitPrice: toMinorUnit(unitPriceDecimal),
      sortOrder,
    };

    setFieldErrors({});
    setRootError(null);

    startTransition(async () => {
      const result = await addLineItemAction(invoiceId, input);

      if (!result.success) {
        setRootError(result.error.message);
        if (result.error.fields) {
          setFieldErrors(result.error.fields as FieldErrors);
        }
        return;
      }

      // Clear form and refresh
      formRef.current?.reset();
      setSortOrder((prev) => prev + 1);
      router.refresh();
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      {rootError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
          {rootError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="sm:col-span-1">
          <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Description <span className="text-red-500">*</span>
          </label>
          <input
            name="description"
            type="text"
            placeholder="Service description"
            maxLength={500}
            required
            className={inputCls(!!fieldErrors.description)}
          />
          {fieldErrors.description && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              {fieldErrors.description[0]}
            </p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Quantity <span className="text-red-500">*</span>
          </label>
          <input
            name="quantity"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="1.00"
            required
            className={inputCls(!!fieldErrors.quantity)}
          />
          {fieldErrors.quantity && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              {fieldErrors.quantity[0]}
            </p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Unit Price <span className="text-red-500">*</span>
          </label>
          <input
            name="unitPrice"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            required
            className={inputCls(!!fieldErrors.unitPrice)}
          />
          {fieldErrors.unitPrice && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              {fieldErrors.unitPrice[0]}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 transition-colors disabled:opacity-50"
        >
          {isPending ? 'Adding…' : 'Add Line Item'}
        </button>
      </div>
    </form>
  );
}

function inputCls(hasError: boolean): string {
  return [
    'block w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500',
    'bg-white dark:bg-zinc-900 dark:text-zinc-50',
    hasError
      ? 'border-red-500 dark:border-red-500'
      : 'border-zinc-300 dark:border-zinc-700',
  ].join(' ');
}
