import Link from 'next/link';

const features = [
  {
    icon: '✓',
    title: 'Tasks',
    description:
      'Manage your work with a full Kanban board and list view. Track status (Backlog → Done), set priority levels, and filter by assignee, label, or due date.',
    how: 'Create a task, drag it across the board as you progress, and mark it done when complete.',
  },
  {
    icon: '⏱',
    title: 'Work Logs',
    description:
      'Log effort against any task. Each entry captures date, description, time spent, and outcome — giving you an accurate record of where your time goes.',
    how: 'Open a task, add a work log entry with the time you spent, and build your daily activity history.',
  },
  {
    icon: '🏆',
    title: 'Achievements',
    description:
      'Document your wins and milestones for performance reviews. Organize by admin-configured categories and export as PDF or Markdown when review season arrives.',
    how: 'Record accomplishments throughout the year so nothing is forgotten when it matters most.',
  },
  {
    icon: '📝',
    title: 'Notes',
    description:
      'Rich-text notes with auto-save every 30 seconds. Link notes to tasks for context, or keep them standalone for ideas and meeting minutes.',
    how: 'Start typing — your note saves automatically. Attach it to a task when it becomes actionable.',
  },
  {
    icon: '📅',
    title: 'Daily To-Do',
    description:
      'Plan your day with a focused to-do list. Incomplete items prompt a carry-over decision at the start of each new day, and any item can be promoted to a full Task.',
    how: 'Each morning, review carry-overs, add today\'s items, and work through the list.',
  },
  {
    icon: '🔍',
    title: 'Global Search',
    description:
      'Full-text search across every module — tasks, notes, achievements, and logs — in one place. Open it instantly with Cmd/Ctrl+K.',
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

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-zinc-900">
      {/* ── Nav ── */}
      <header className="border-b border-zinc-100">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-xl font-bold tracking-tight text-teal-600">MyWork</span>
          <nav className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-md px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="mx-auto max-w-6xl px-6 py-24 text-center">
        <div className="mx-auto max-w-3xl">
          <span className="inline-block rounded-full bg-teal-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-teal-600 mb-6">
            Personal work management
          </span>
          <h1 className="text-5xl font-extrabold leading-tight tracking-tight text-zinc-900 sm:text-6xl">
            Everything you need to<br />
            <span className="text-teal-600">stay on top of your work</span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-zinc-500">
            Tasks, work logs, achievements, notes, and daily planning — all in one place.
            MyWork helps you track what you do, surface your wins, and stay productive every day.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/register"
              className="rounded-lg bg-teal-600 px-8 py-3 text-base font-semibold text-white shadow-sm hover:bg-teal-700 transition-colors"
            >
              Create an account
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-zinc-200 bg-white px-8 py-3 text-base font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="bg-zinc-50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-zinc-900">Everything in one workspace</h2>
            <p className="mt-3 text-zinc-500">Six integrated modules that cover your entire work lifecycle.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-zinc-100 bg-white p-6 shadow-sm"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-teal-50 text-xl">
                  {f.icon}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-zinc-900">{f.title}</h3>
                <p className="mb-4 text-sm leading-relaxed text-zinc-500">{f.description}</p>
                <p className="text-xs font-medium text-teal-600">
                  <span className="font-semibold">How to use: </span>{f.how}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-zinc-900">How it works</h2>
            <p className="mt-3 text-zinc-500">Up and running in minutes.</p>
          </div>
          <ol className="relative mx-auto max-w-2xl space-y-8">
            {steps.map((s, i) => (
              <li key={s.step} className="flex gap-5">
                <div className="shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-600 text-sm font-bold text-white">
                    {s.step}
                  </div>
                  {i < steps.length - 1 && (
                    <div className="mx-auto mt-1 h-full w-px bg-teal-100" style={{ minHeight: '2rem' }} />
                  )}
                </div>
                <div className="pb-2">
                  <h3 className="font-semibold text-zinc-900">{s.heading}</h3>
                  <p className="mt-1 text-sm text-zinc-500">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── CTA banner ── */}
      <section className="bg-teal-600 py-16">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h2 className="text-3xl font-bold text-white">Ready to get organised?</h2>
          <p className="mt-3 text-teal-100">
            Request an account today and start tracking your work the right way.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/register"
              className="rounded-lg bg-white px-8 py-3 text-base font-semibold text-teal-700 hover:bg-teal-50 transition-colors"
            >
              Create an account
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-teal-400 px-8 py-3 text-base font-semibold text-white hover:bg-teal-700 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-zinc-100 py-8">
        <div className="mx-auto max-w-6xl px-6 text-center text-sm text-zinc-400">
          © {new Date().getFullYear()} MyWork. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
