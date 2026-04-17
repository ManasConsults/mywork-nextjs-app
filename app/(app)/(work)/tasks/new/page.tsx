import type { Metadata } from 'next';

import { TaskForm } from '../_components/TaskForm';

export const metadata: Metadata = { title: 'MyWork — New Task' };

interface NewTaskPageProps {
  searchParams: Promise<{ from?: string }>;
}

export default async function NewTaskPage({ searchParams }: NewTaskPageProps): Promise<React.JSX.Element> {
  const { from } = await searchParams;
  const returnTo = from === 'board' ? '/tasks/board' : '/tasks';

  return (
    <div className="mx-auto max-w-xl">
      <TaskForm returnTo={returnTo} />
    </div>
  );
}
