export default function NoteDetailLoading(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-3xl animate-pulse space-y-4">
      <div className="h-8 w-64 rounded bg-muted" />
      <div className="h-10 w-full rounded bg-muted" />
      <div className="flex gap-3">
        <div className="h-8 w-40 rounded bg-muted" />
        <div className="h-8 w-48 rounded bg-muted" />
      </div>
      <div className="h-8 w-full rounded bg-muted" />
      <div className="h-72 w-full rounded bg-muted" />
    </div>
  );
}
