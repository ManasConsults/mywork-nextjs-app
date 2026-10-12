import type { ReactNode } from 'react';

export interface Feature {
  icon: ReactNode;
  title: string;
  description: string;
  how: string;
}

export const features: readonly Feature[] = [
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
