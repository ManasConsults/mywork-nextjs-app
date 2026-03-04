'use client';

import type { Achievement } from '@prisma/client';

import { fiscalYearLabel } from '@/lib/utils/fiscal-year';

type AchievementWithTask = Achievement & { task: { id: string; title: string } | null };

interface ExportButtonsProps {
  achievements: AchievementWithTask[];
  reviewYear?: number;
  fiscalYearStartMonth: number;
  category?: string;
}

function generateMarkdown(
  achievements: AchievementWithTask[],
  reviewYear: number | undefined,
  fiscalYearStartMonth: number,
): string {
  const heading = reviewYear
    ? `# Achievements — ${fiscalYearLabel(reviewYear, fiscalYearStartMonth)}`
    : '# Achievements';

  const lines: string[] = [heading, ''];

  for (const a of achievements) {
    lines.push(`## ${a.title}`);

    const meta: string[] = [];
    if (a.category) meta.push(`**Category:** ${a.category}`);
    if (a.impactRating) meta.push(`**Impact:** ${'★'.repeat(a.impactRating)}${'☆'.repeat(5 - a.impactRating)}`);
    if (a.dateAchieved) {
      meta.push(
        `**Date:** ${new Date(a.dateAchieved).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}`,
      );
    }
    if (meta.length > 0) lines.push(meta.join(' | '));

    lines.push('');
    lines.push(a.description);

    if (a.task) lines.push('', `**Linked task:** ${a.task.title}`);
    lines.push('');
  }

  return lines.join('\n');
}

export function ExportButtons({
  achievements,
  reviewYear,
  fiscalYearStartMonth,
  category,
}: ExportButtonsProps): React.JSX.Element {
  function handleMarkdownDownload() {
    const md = generateMarkdown(achievements, reviewYear, fiscalYearStartMonth);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = reviewYear
      ? `achievements-fy${reviewYear}.md`
      : 'achievements.md';
    a.click();
    URL.revokeObjectURL(url);
  }

  function handlePrint() {
    const params = new URLSearchParams();
    if (reviewYear) params.set('reviewYear', String(reviewYear));
    if (category) params.set('category', category);
    params.set('fiscalYearStartMonth', String(fiscalYearStartMonth));
    window.open(`/achievements-print?${params.toString()}`, '_blank');
  }

  const btnCls =
    'flex items-center gap-1.5 rounded-md border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800';

  return (
    <div className="flex gap-2">
      <button onClick={handleMarkdownDownload} className={btnCls} title="Download as Markdown">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Markdown
      </button>
      <button onClick={handlePrint} className={btnCls} title="Print as PDF">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 6 2 18 2 18 9" />
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
          <rect x="6" y="14" width="12" height="8" />
        </svg>
        Print PDF
      </button>
    </div>
  );
}
