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
      <div className="rounded-xl border border-border bg-card p-6">
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
