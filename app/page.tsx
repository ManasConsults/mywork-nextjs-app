import Link from 'next/link';

const features = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
    title: 'Tasks',
    description: 'Manage your work with a full Kanban board and list view. Track status, set priority levels, and filter by due date.',
    how: 'Create a task, drag it across the board as you progress, and mark it done when complete.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
    title: 'Work Logs',
    description: 'Log effort against any task. Each entry captures date, description, time spent, and outcome — an accurate record of where your time goes.',
    how: 'Open a task, add a work log entry with the time you spent, and build your daily activity history.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
    title: 'Achievements',
    description: 'Document your wins and milestones for performance reviews. Organise by category and export as PDF or Markdown.',
    how: 'Record accomplishments throughout the year so nothing is forgotten when it matters most.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
      </svg>
    ),
    title: 'Notes',
    description: 'Rich-text notes with auto-save every 30 seconds. Link notes to tasks for context, or keep them standalone for ideas and meeting minutes.',
    how: 'Start typing — your note saves automatically. Attach it to a task when it becomes actionable.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
    title: 'Daily To-Do',
    description: 'Plan your day with a focused to-do list. Incomplete items prompt a carry-over decision each morning, and any item can be promoted to a full Task.',
    how: "Each morning, review carry-overs, add today's items, and work through the list.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
      </svg>
    ),
    title: 'Global Search',
    description: 'Full-text search across every module — tasks, notes, achievements, and logs — in one place. Open it instantly with Cmd/Ctrl+K.',
    how: 'Press Cmd+K anywhere in the app, type a keyword, and jump directly to the result.',
  },
];

const steps = [
  { step: '1', heading: 'Request an account', body: 'Register with your name and email. An admin will review and activate your account.' },
  { step: '2', heading: 'Sign in', body: 'Once approved, sign in and land on your personal dashboard with task stats and activity.' },
  { step: '3', heading: 'Create tasks', body: 'Add tasks with priority, status, and due date. View them in a list or drag them on the Kanban board.' },
  { step: '4', heading: 'Log your work', body: 'Attach work log entries to tasks as you go, then review your time at the end of the week.' },
  { step: '5', heading: 'Record achievements', body: 'Capture milestones and wins throughout the year for easy export at performance review time.' },
];

export default function HomePage(): React.JSX.Element {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">
      {/* ── Nav ── */}
      <header className="border-b border-zinc-100 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-xl font-bold tracking-tight text-primary">MyWork</span>
          <nav className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-md px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="mx-auto max-w-6xl px-6 py-24 text-center">
        <div className="mx-auto max-w-3xl">
          <span className="inline-block rounded-full bg-primary/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary mb-6">
            Personal work management
          </span>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl lg:text-6xl">
            Everything you need to<br />
            <span className="text-primary">stay on top of your work</span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-zinc-500 dark:text-zinc-400">
            Tasks, work logs, achievements, notes, and daily planning — all in one place.
            MyWork helps you track what you do, surface your wins, and stay productive every day.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/register"
              className="rounded-lg bg-primary px-8 py-3 text-base font-semibold text-white hover:bg-primary/90 transition-colors dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Create an account
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-8 py-3 text-base font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="bg-zinc-50 dark:bg-zinc-900 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Everything in one workspace</h2>
            <p className="mt-3 text-zinc-500 dark:text-zinc-400">Six integrated modules that cover your entire work lifecycle.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/5 text-primary">
                  {f.icon}
                </div>
                <h3 className="mb-2 text-base font-semibold text-zinc-900 dark:text-zinc-50">{f.title}</h3>
                <p className="mb-4 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{f.description}</p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  <span className="font-semibold text-primary">How to use: </span>{f.how}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-20 bg-white dark:bg-zinc-950">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">How it works</h2>
            <p className="mt-3 text-zinc-500 dark:text-zinc-400">Up and running in minutes.</p>
          </div>
          <ol className="relative mx-auto max-w-2xl space-y-8">
            {steps.map((s, i) => (
              <li key={s.step} className="flex gap-5">
                <div className="shrink-0 flex flex-col items-center">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                    {s.step}
                  </div>
                  {i < steps.length - 1 && (
                    <div className="mt-2 w-px flex-1 bg-primary/10" style={{ minHeight: '2rem' }} />
                  )}
                </div>
                <div className="pb-2 pt-1">
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">{s.heading}</h3>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── CTA banner ── */}
      <section className="bg-primary py-16">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h2 className="text-3xl font-bold text-white">Ready to get organised?</h2>
          <p className="mt-3 text-primary-foreground">
            Request an account today and start tracking your work the right way.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/register"
              className="rounded-lg bg-white px-8 py-3 text-base font-semibold text-primary hover:bg-primary/5 transition-colors"
            >
              Create an account
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-primary dark:border-primary px-8 py-3 text-base font-semibold text-white hover:bg-primary/90 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-zinc-100 dark:border-zinc-800 py-8 bg-white dark:bg-zinc-950">
        <div className="mx-auto max-w-6xl px-6 text-center text-sm text-zinc-400 dark:text-zinc-500">
          © {new Date().getFullYear()} MyWork. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
