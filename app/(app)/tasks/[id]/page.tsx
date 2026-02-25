import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';

import { authOptions } from '@/lib/auth/auth';
import { getTaskById } from '@/lib/services/task.service';
import { TaskForm } from '../_components/TaskForm';
import { DeleteTaskButton } from '../_components/DeleteTaskButton';

export const metadata: Metadata = { title: 'MyWork — Edit Task' };

interface TaskDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TaskDetailPage({ params }: TaskDetailPageProps): Promise<React.JSX.Element> {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const { id } = await params;
  const task = await getTaskById(userId, id);
  if (!task) notFound();

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Edit task</h1>
      <TaskForm task={task} />
      <div className="mt-6 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <DeleteTaskButton taskId={task.id} />
      </div>
    </div>
  );
}
