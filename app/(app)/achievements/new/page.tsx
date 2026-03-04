import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';

import { authOptions } from '@/lib/auth/auth';
import { getTasksByUser } from '@/lib/services/task.service';
import { AchievementForm } from '../_components/AchievementForm';

export const metadata: Metadata = { title: 'MyWork — New Achievement' };

export default async function NewAchievementPage(): Promise<React.JSX.Element> {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;
  const tasks = await getTasksByUser(userId);

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        New achievement
      </h1>
      <AchievementForm tasks={tasks} />
    </div>
  );
}
