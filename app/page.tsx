import React from 'react';
import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth';
import { features } from '@/components/marketing/features';
import { PublicFooter } from '@/components/legal/PublicFooter';
import { CONTACT_EMAIL } from '@/lib/legal/constants';
import { formatDeletionDate, isValidIsoDate } from '@/lib/legal/deletion';

// next-auth/react (SessionProvider in root layout) calls new URL(NEXTAUTH_URL)
// during module evaluation — prevent pre-rendering so it only runs at request time.
export const dynamic = 'force-dynamic';

const steps = [
  { step: '1', heading: 'Request an account', body: 'Register with your name and email. An admin will review and activate your account.' },
  { step: '2', heading: 'Sign in', body: 'Once approved, sign in and land on your personal dashboard with task stats and activity.' },
  { step: '3', heading: 'Create tasks', body: 'Add tasks with priority, status, and due date. View them in a list or drag them on the Kanban board.' },
  { step: '4', heading: 'Log your work', body: 'Attach work log entries to tasks as you go, then review your time at the end of the week.' },
  { step: '5', heading: 'Record achievements', body: 'Capture milestones and wins throughout the year for easy export at performance review time.' },
];

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ deletionRequested?: string }>;
}): Promise<React.JSX.Element> {
  const { deletionRequested } = await searchParams;
  const session = await getServerSession(authOptions);
  const isLoggedIn = !!session;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Nav ── */}
      <div className="sticky top-0 z-10 px-3 pt-3 pb-1">
        <header className="mx-auto flex max-w-6xl items-center justify-between px-6 h-14 rounded-2xl border border-border/60 bg-background/90 backdrop-blur-sm shadow-[0_4px_20px_rgba(0,0,0,0.08),0_1px_4px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4),0_1px_4px_rgba(0,0,0,0.25)]">
          <span className="text-xl font-bold tracking-tight text-primary">MyWork</span>
          <nav className="flex items-center gap-2">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all duration-150 active:scale-[0.97]"
              >
                Go to dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-all duration-150 active:scale-[0.97]"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all duration-150 active:scale-[0.97]"
                >
                  Get started
                </Link>
              </>
            )}
          </nav>
        </header>
      </div>

      {deletionRequested && isValidIsoDate(deletionRequested) && (
        <div
          role="status"
          className="mx-auto mt-4 max-w-6xl rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground"
        >
          Your account is scheduled for permanent deletion after {formatDeletionDate(deletionRequested)}. To cancel before then,{' '}
          <a
            href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Cancel account deletion')}`}
            className="font-medium text-primary hover:underline"
          >
            email {CONTACT_EMAIL}
          </a>{' '}
          with the subject &quot;Cancel account deletion&quot;.
        </div>
      )}

      {/* ── Hero ── */}
      <section className="mx-auto max-w-6xl px-6 py-24 text-center">
        <div className="mx-auto max-w-3xl">
          <span className="inline-block rounded-full bg-primary/8 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary mb-6">
            Personal work management
          </span>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Everything you need to<br />
            <span className="text-primary">stay on top of your work</span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            Tasks, work logs, achievements, notes, and daily planning — all in one place.
            MyWork helps you track what you do, surface your wins, and stay productive every day.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="rounded-lg bg-primary px-8 py-3 text-base font-semibold text-primary-foreground hover:bg-primary/90 transition-all duration-150 active:scale-[0.97]"
              >
                Go to dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="rounded-lg bg-primary px-8 py-3 text-base font-semibold text-primary-foreground hover:bg-primary/90 transition-all duration-150 active:scale-[0.97]"
                >
                  Create an account
                </Link>
                <Link
                  href="/login"
                  className="rounded-lg border border-border bg-background px-8 py-3 text-base font-semibold text-foreground hover:bg-accent transition-all duration-150 active:scale-[0.97]"
                >
                  Sign in
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="bg-muted/40 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-foreground">Everything in one workspace</h2>
            <p className="mt-3 text-muted-foreground">Six integrated modules that cover your entire work lifecycle.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-border bg-card p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08),0_1px_4px_rgba(0,0,0,0.04)] hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.06)] transition-all duration-200"
              >
                <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-primary/8 text-primary">
                  {f.icon}
                </div>
                <h3 className="mb-2 text-base font-semibold text-card-foreground">{f.title}</h3>
                <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{f.description}</p>
                <p className="text-xs text-muted-foreground">
                  <span className="font-semibold text-primary">How to use: </span>{f.how}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-20 bg-background">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-foreground">How it works</h2>
            <p className="mt-3 text-muted-foreground">Up and running in minutes.</p>
          </div>
          <ol className="relative mx-auto max-w-2xl flex flex-col gap-8">
            {steps.map((s, i) => (
              <li key={s.step} className="flex gap-5">
                <div className="shrink-0 flex flex-col items-center">
                  <div className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {s.step}
                  </div>
                  {i < steps.length - 1 && (
                    <div className="mt-2 w-px flex-1 bg-primary/15" style={{ minHeight: '2rem' }} />
                  )}
                </div>
                <div className="pb-2 pt-1">
                  <h3 className="font-semibold text-foreground">{s.heading}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── CTA banner ── */}
      <section className="bg-primary py-16">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h2 className="text-3xl font-bold text-primary-foreground">Ready to get organised?</h2>
          <p className="mt-3 text-primary-foreground/80">
            Request an account today and start tracking your work the right way.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="rounded-lg bg-background px-8 py-3 text-base font-semibold text-primary hover:bg-background/90 transition-all duration-150 active:scale-[0.97]"
              >
                Go to dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="rounded-lg bg-background px-8 py-3 text-base font-semibold text-primary hover:bg-background/90 transition-all duration-150 active:scale-[0.97]"
                >
                  Create an account
                </Link>
                <Link
                  href="/login"
                  className="rounded-lg border border-primary-foreground/30 px-8 py-3 text-base font-semibold text-primary-foreground hover:bg-primary-foreground/10 transition-all duration-150 active:scale-[0.97]"
                >
                  Sign in
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
