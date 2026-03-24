import { Suspense } from 'react';

import { getWorkLogsByUserPaged } from '@/lib/services/work-log.service';
import type { WorkLogFilters } from '@/lib/schemas/work-log.schema';
import { WorkLogList } from './WorkLogList';
import { WorkLogPagination } from './WorkLogPagination';

interface Props {
  userId: string;
  filters: WorkLogFilters;
}

function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export async function WorkLogListServer({ userId, filters }: Props): Promise<React.JSX.Element> {
  const { logs, total, totalHours, page, pageSize, totalPages } = await getWorkLogsByUserPaged(userId, filters);

  return (
    <>
      {totalHours > 0 && (
        <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
          Total logged:{' '}
          <span className="font-medium text-teal-600 dark:text-teal-400">
            {formatHours(totalHours)}
          </span>
          {' '}across {total} {total === 1 ? 'entry' : 'entries'}
        </p>
      )}
      <WorkLogList logs={logs} />
      <Suspense>
        <WorkLogPagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} />
      </Suspense>
    </>
  );
}
