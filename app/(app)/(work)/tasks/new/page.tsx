import type { Metadata } from 'next';

import { TaskForm } from '../_components/TaskForm';

export const metadata: Metadata = { title: 'MyWork — New Task' };

export default function NewTaskPage(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">New task</h1>
      <TaskForm />
    </div>
  );
}
