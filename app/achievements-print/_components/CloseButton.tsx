'use client';

export function CloseButton(): React.JSX.Element {
  return (
    <button
      onClick={() => window.close()}
      style={{ position: 'fixed', top: 12, right: 16 }}
      className="no-print bg-zinc-700 hover:bg-zinc-900 text-white text-xs px-2.5 py-1 rounded cursor-pointer border-none transition-colors"
    >
      Close
    </button>
  );
}
