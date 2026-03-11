import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';

import { authOptions } from '@/lib/auth/auth';
import { getAchievementById } from '@/lib/services/achievement.service';
import { getTasksByUser } from '@/lib/services/task.service';
import { deleteAchievementAction } from '@/lib/actions/achievement';
import { AchievementForm } from '../_components/AchievementForm';
import { DeleteButton } from '../_components/DeleteButton';

export const metadata: Metadata = { title: 'MyWork — Edit Achievement' };

interface AchievementDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AchievementDetailPage({ params }: AchievementDetailPageProps): Promise<React.JSX.Element> {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const { id } = await params;
  const [achievement, tasks] = await Promise.all([
    getAchievementById(userId, id),
    getTasksByUser(userId),
  ]);
  if (!achievement) notFound();

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Edit achievement
      </h1>
      <AchievementForm achievement={achievement} tasks={tasks} />
      <div className="mt-6 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <DeleteButton id={achievement.id} title={achievement.title} action={deleteAchievementAction} />
      </div>
    </div>
  );
}
