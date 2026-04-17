type TitleEntry = { pattern: string | RegExp; title: string };

// Order matters — most specific patterns first
const TITLE_MAP: TitleEntry[] = [
  // Tasks
  { pattern: '/tasks/board',              title: 'Task Board' },
  { pattern: '/tasks/new',                title: 'New Task' },
  { pattern: /^\/tasks\/[^/]+/,           title: 'Edit Task' },
  { pattern: '/tasks',                    title: 'Tasks' },

  // Work logs
  { pattern: /^\/work-logs\/[^/]+\/edit/, title: 'Edit Work Log' },
  { pattern: '/work-logs/new',            title: 'New Work Log' },
  { pattern: '/work-logs',                title: 'Work Logs' },

  // Achievements
  { pattern: '/achievements/new',         title: 'New Achievement' },
  { pattern: /^\/achievements\/[^/]+/,    title: 'Achievement' },
  { pattern: '/achievements',             title: 'Achievements' },

  // Notes
  { pattern: /^\/notes\/[^/]+\/edit/,     title: 'Edit Note' },
  { pattern: '/notes/new',                title: 'New Note' },
  { pattern: /^\/notes\/[^/]+/,           title: 'Note' },
  { pattern: '/notes',                    title: 'Notes' },

  // Finance — accounts
  { pattern: /^\/finance\/accounts\/[^/]+/, title: 'Account' },
  { pattern: '/finance/accounts/new',     title: 'New Account' },
  { pattern: '/finance/accounts',         title: 'Accounts' },

  // Finance — clients
  { pattern: /^\/finance\/clients\/[^/]+\/edit/, title: 'Edit Client' },
  { pattern: /^\/finance\/clients\/[^/]+/,       title: 'Client' },
  { pattern: '/finance/clients/new',      title: 'New Client' },
  { pattern: '/finance/clients',          title: 'Clients' },

  // Finance — invoices
  { pattern: /^\/finance\/invoices\/[^/]+/, title: 'Invoice' },
  { pattern: '/finance/invoices/new',     title: 'New Invoice' },
  { pattern: '/finance/invoices',         title: 'Invoices' },

  // Finance — transactions
  { pattern: /^\/finance\/transactions\/[^/]+\/edit/, title: 'Edit Transaction' },
  { pattern: '/finance/transactions/new', title: 'New Transaction' },
  { pattern: '/finance/transactions',     title: 'Transactions' },

  // Finance — other
  { pattern: '/finance/categories',       title: 'Categories' },
  { pattern: '/finance/timesheets',       title: 'Timesheets' },
  { pattern: '/finance/reports',          title: 'Reports' },
  { pattern: '/finance',                  title: 'Finance' },

  // Admin
  { pattern: '/admin/users',              title: 'Users' },
  { pattern: '/admin/feedback',           title: 'Feedback' },
  { pattern: '/admin',                    title: 'Admin' },

  // Top-level
  { pattern: '/dashboard',                title: 'Dashboard' },
  { pattern: '/todo',                     title: 'To-do' },
  { pattern: '/feedback',                 title: 'My Feedback' },
  { pattern: '/profile',                  title: 'Profile' },
  { pattern: '/module-unavailable',       title: 'Module Unavailable' },
];

export function getPageTitle(pathname: string): string {
  for (const { pattern, title } of TITLE_MAP) {
    if (typeof pattern === 'string') {
      if (pathname === pattern) return title;
    } else {
      if (pattern.test(pathname)) return title;
    }
  }
  return 'MyWork';
}
