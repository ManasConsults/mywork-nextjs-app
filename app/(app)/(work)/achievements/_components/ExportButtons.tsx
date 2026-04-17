'use client';

import { Download, Printer } from 'lucide-react';
import type { Achievement } from '@prisma/client';

import { fiscalYearLabel } from '@/lib/utils/fiscal-year';
import { Button } from '@/components/ui/button';

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
      meta.push(`**Date:** ${new Date(a.dateAchieved).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}`);
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
    a.download = reviewYear ? `achievements-fy${reviewYear}.md` : 'achievements.md';
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

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={handleMarkdownDownload} title="Download as Markdown" className="gap-1.5">
        <Download className="h-3.5 w-3.5" />
        Markdown
      </Button>
      <Button variant="outline" size="sm" onClick={handlePrint} title="Print as PDF" className="gap-1.5">
        <Printer className="h-3.5 w-3.5" />
        Print PDF
      </Button>
    </div>
  );
}
