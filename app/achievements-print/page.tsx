import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';

import { authOptions } from '@/lib/auth/auth';
import { getAchievementsByUser } from '@/lib/services/achievement.service';
import { fiscalYearLabel } from '@/lib/utils/fiscal-year';
import type { AchievementFilters } from '@/lib/schemas/achievement.schema';
import { ACHIEVEMENT_CATEGORIES } from '@/lib/schemas/achievement.schema';
import { AutoPrint } from './_components/AutoPrint';
import { CloseButton } from './_components/CloseButton';

export const metadata: Metadata = { title: 'MyWork — Achievements (Print)' };

interface PrintPageProps {
  searchParams: Promise<{
    category?: string;
    reviewYear?: string;
    fiscalYearStartMonth?: string;
  }>;
}

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  ACHIEVEMENT_CATEGORIES.map((c) => [c, c]),
);

function StarRating({ rating }: { rating: number | null }): React.JSX.Element | null {
  if (!rating) return null;
  return (
    <span style={{ letterSpacing: '0.05em' }}>
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  );
}

export default async function AchievementsPrintPage({ searchParams }: PrintPageProps): Promise<React.JSX.Element> {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const { category, reviewYear: reviewYearStr, fiscalYearStartMonth: fyMonthStr } = await searchParams;
  const fiscalYearStartMonth = fyMonthStr ? Number(fyMonthStr) : 4;
  const reviewYear = reviewYearStr ? Number(reviewYearStr) : undefined;

  const filters: AchievementFilters = {
    ...(category && CATEGORY_LABELS[category] ? { category: category as AchievementFilters['category'] } : {}),
    ...(reviewYear ? { reviewYear } : {}),
  };

  const achievements = await getAchievementsByUser(userId, filters, fiscalYearStartMonth);

  const heading = reviewYear
    ? fiscalYearLabel(reviewYear, fiscalYearStartMonth)
    : 'All Achievements';

  const subheading = [
    category ? `Category: ${category}` : null,
    `${achievements.length} ${achievements.length === 1 ? 'achievement' : 'achievements'}`,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <>
      <AutoPrint />
      <style>{`
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
        body {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 13px;
          line-height: 1.6;
          color: #111;
          background: #fff;
          padding: 32px 40px;
          max-width: 780px;
          margin: 0 auto;
        }
        h1 { font-size: 22px; margin: 0 0 4px; }
        .meta { font-size: 12px; color: #555; margin-bottom: 28px; }
        .achievement { border-top: 1px solid #ccc; padding: 14px 0; page-break-inside: avoid; }
        .achievement-title { font-size: 15px; font-weight: bold; margin-bottom: 4px; }
        .achievement-meta { font-size: 11px; color: #555; margin-bottom: 6px; display: flex; gap: 16px; flex-wrap: wrap; }
        .badge { background: #f0f0f0; padding: 1px 7px; border-radius: 10px; font-size: 11px; }
        .stars { color: #c49d00; }
        .description { white-space: pre-wrap; margin: 0; }
        .task-link { font-size: 11px; color: #555; margin-top: 4px; }
        .no-results { color: #888; font-style: italic; padding: 24px 0; }
      `}</style>

      <CloseButton />

      <h1>Achievements — {heading}</h1>
      <p className="meta">{subheading}</p>

      {achievements.length === 0 ? (
        <p className="no-results">No achievements found for the selected filters.</p>
      ) : (
        achievements.map((ach) => (
          <div key={ach.id} className="achievement">
            <div className="achievement-title">{ach.title}</div>
            <div className="achievement-meta">
              {ach.dateAchieved && (
                <span>{new Date(ach.dateAchieved).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              )}
              {ach.category && <span className="badge">{ach.category}</span>}
              {ach.impactRating && (
                <span className="stars">
                  <StarRating rating={ach.impactRating} />
                </span>
              )}
            </div>
            <p className="description">{ach.description}</p>
            {ach.task && (
              <p className="task-link">Related task: {ach.task.title}</p>
            )}
          </div>
        ))
      )}
    </>
  );
}
