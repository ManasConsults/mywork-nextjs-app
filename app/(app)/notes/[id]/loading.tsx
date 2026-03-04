export default function NoteDetailLoading(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-3xl animate-pulse space-y-4">
      <div className="h-8 w-64 rounded bg-zinc-200 dark:bg-zinc-700" />
      <div className="h-10 w-full rounded bg-zinc-200 dark:bg-zinc-700" />
      <div className="flex gap-3">
        <div className="h-8 w-40 rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="h-8 w-48 rounded bg-zinc-200 dark:bg-zinc-700" />
      </div>
      <div className="h-8 w-full rounded bg-zinc-200 dark:bg-zinc-700" />
      <div className="h-72 w-full rounded bg-zinc-200 dark:bg-zinc-700" />
    </div>
  );
}
