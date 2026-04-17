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
      <div className="rounded-xl border border-border bg-card p-6">
        <TransactionForm
          accounts={accounts}
          categories={categories}
          employmentType={employmentType}
        />
      </div>
    </div>
  );
}
