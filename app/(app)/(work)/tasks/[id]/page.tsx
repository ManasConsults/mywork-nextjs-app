import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';

import { authOptions } from '@/lib/auth/auth';
import { getTaskById } from '@/lib/services/task.service';
import { getWorkLogsByTask } from '@/lib/services/work-log.service';
import { TaskForm } from '../_components/TaskForm';
import { DeleteTaskButton } from '../_components/DeleteTaskButton';
import { WorkLogSection } from '../_components/WorkLogSection';

export const metadata: Metadata = { title: 'MyWork — Edit Task' };

interface TaskDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TaskDetailPage({ params }: TaskDetailPageProps): Promise<React.JSX.Element> {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const { id } = await params;
  const [task, workLogs] = await Promise.all([
    getTaskById(userId, id),
    getWorkLogsByTask(userId, id),
  ]);
  if (!task) notFound();

  return (
    <div className="mx-auto max-w-xl">
      <TaskForm task={task} />
      <div className="mt-6 border-t border-border pt-6">
        <DeleteTaskButton taskId={task.id} />
      </div>
      <div className="mt-8 border-t border-border pt-8">
        <WorkLogSection taskId={task.id} initialLogs={workLogs} />
      </div>
    </div>
  );
}
