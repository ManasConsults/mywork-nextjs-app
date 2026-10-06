'use client';

import { useEffect } from 'react';

import { TASK_VIEW_COOKIE, type TaskView } from './task-view';

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/** Records the view on arrival (links, back/forward, bookmarks) so `/tasks` can reopen it. */
export function RememberTaskView({ view }: { view: TaskView }): null {
  useEffect(() => {
    document.cookie = `${TASK_VIEW_COOKIE}=${view}; path=/tasks; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
  }, [view]);

  return null;
}
