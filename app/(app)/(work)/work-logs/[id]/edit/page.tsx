import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';

import { authOptions } from '@/lib/auth/auth';
import { getOpenTasksByUser } from '@/lib/services/task.service';
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

  const workLog = await prisma.workLog.findFirst({ where: { id, userId } });

  if (!workLog) notFound();

  const tasks = await getOpenTasksByUser(userId, workLog.taskId ?? undefined);

  return (
    <div className="mx-auto max-w-xl">
      <WorkLogForm tasks={tasks} workLog={workLog} />
    </div>
  );
}
