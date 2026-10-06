// Kept out of the 'use client' component so server pages can import the values, not client references.
export const TASK_VIEW_COOKIE = 'taskView';

export type TaskView = 'list' | 'board';
