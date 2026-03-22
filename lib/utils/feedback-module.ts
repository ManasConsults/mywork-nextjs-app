/**
 * Normalises a Next.js pathname to a top-level module label for feedback tagging.
 * No external dependencies — pure function safe for both server and client.
 */
export function normaliseModuleFromPath(pathname: string): string {
  if (pathname.startsWith('/finance')) return 'Finance';
  if (
    pathname.startsWith('/tasks') ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/work-logs') ||
    pathname.startsWith('/achievements') ||
    pathname.startsWith('/notes') ||
    pathname.startsWith('/todo')
  ) {
    return 'Work';
  }
  if (pathname.startsWith('/admin')) return 'Admin';
  return 'General';
}
