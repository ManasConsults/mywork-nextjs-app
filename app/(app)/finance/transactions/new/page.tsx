import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';

import { authOptions } from '@/lib/auth/auth';
import { getAccounts } from '@/lib/services/finance/account.service';
import { getCategories } from '@/lib/services/finance/category.service';
import { TransactionForm } from '../_components/TransactionForm';

export const metadata: Metadata = { title: 'MyWork — New Transaction' };

export default async function NewTransactionPage(): Promise<React.JSX.Element> {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;
  const employmentType = session!.user.employmentType;

  const [accounts, categories] = await Promise.all([
    getAccounts(userId),
    getCategories(userId),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50 mb-6">
        New Transaction
      </h1>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <TransactionForm
          accounts={accounts}
          categories={categories}
          employmentType={employmentType}
        />
      </div>
    </div>
  );
}
