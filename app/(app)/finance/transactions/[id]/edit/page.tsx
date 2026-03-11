import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';

import { authOptions } from '@/lib/auth/auth';
import { getAccounts } from '@/lib/services/finance/account.service';
import { getCategories } from '@/lib/services/finance/category.service';
import { getTransactionById } from '@/lib/services/finance/transaction.service';
import { TransactionForm } from '../../_components/TransactionForm';

export const metadata: Metadata = { title: 'MyWork — Edit Transaction' };

interface EditTransactionPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTransactionPage({
  params,
}: EditTransactionPageProps): Promise<React.JSX.Element> {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;
  const employmentType = session!.user.employmentType;

  const { id } = await params;

  const [transaction, accounts, categories] = await Promise.all([
    getTransactionById(userId, id),
    getAccounts(userId),
    getCategories(userId),
  ]);

  if (!transaction) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50 mb-6">
        Edit Transaction
      </h1>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <TransactionForm
          transaction={transaction}
          accounts={accounts}
          categories={categories}
          employmentType={employmentType}
        />
      </div>
    </div>
  );
}
