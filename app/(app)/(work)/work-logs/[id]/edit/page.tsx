import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';

import { authOptions } from '@/lib/auth/auth';
import { getTasksByUser } from '@/lib/services/task.service';
import { prisma } from '@/lib/db/prisma';
import { WorkLogForm } from '../../_components/WorkLogForm';

export const metadata: Metadata = { title: 'MyWork — Edit Work Log' };

interface EditWorkLogPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditWorkLogPage({ params }: EditWorkLogPageProps): Promise<React.JSX.Element> {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const { id } = await params;

  const [workLog, tasks] = await Promise.all([
    prisma.workLog.findFirst({ where: { id, userId } }),
    getTasksByUser(userId),
  ]);

  if (!workLog) notFound();

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Edit work log</h1>
      <WorkLogForm tasks={tasks} workLog={workLog} />
    </div>
  );
}
