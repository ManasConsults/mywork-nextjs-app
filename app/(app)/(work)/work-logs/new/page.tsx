import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';

import { authOptions } from '@/lib/auth/auth';
import { getTasksByUser } from '@/lib/services/task.service';
import { WorkLogForm } from '../_components/WorkLogForm';

export const metadata: Metadata = { title: 'MyWork — New Work Log' };

interface NewWorkLogPageProps {
  searchParams: Promise<{ taskId?: string }>;
}

export default async function NewWorkLogPage({ searchParams }: NewWorkLogPageProps): Promise<React.JSX.Element> {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const { taskId } = await searchParams;
  const tasks = await getTasksByUser(userId);

  return (
    <div className="mx-auto max-w-xl">
      <WorkLogForm tasks={tasks} defaultTaskId={taskId} />
    </div>
  );
}
