import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';

import { authOptions } from '@/lib/auth/auth';
import { getTasksByUser } from '@/lib/services/task.service';
import { NoteEditor } from '../_components/NoteEditor';

export const metadata: Metadata = { title: 'MyWork — New Note' };

export default async function NewNotePage(): Promise<React.JSX.Element> {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;
  const tasks = await getTasksByUser(userId);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">New note</h1>
      <NoteEditor tasks={tasks.map((t) => ({ id: t.id, title: t.title }))} />
    </div>
  );
}
