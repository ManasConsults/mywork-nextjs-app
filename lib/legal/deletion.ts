export const ACCOUNT_DELETION_GRACE_DAYS = 14;
export const ACCOUNT_DELETION_GRACE_MS = ACCOUNT_DELETION_GRACE_DAYS * 24 * 60 * 60 * 1000;

/** Instant from which the account may be permanently deleted: request time plus the grace period. */
export function computeDeletionDueAt(requestedAt: Date): Date {
  return new Date(requestedAt.getTime() + ACCOUNT_DELETION_GRACE_MS);
}

export function isDeletionDue(requestedAt: Date, now: Date): boolean {
  return now.getTime() >= computeDeletionDueAt(requestedAt).getTime();
}

const BRISBANE_DATE = new Intl.DateTimeFormat('en-AU', {
  timeZone: 'Australia/Brisbane',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const BRISBANE_DATE_TIME = new Intl.DateTimeFormat('en-AU', {
  timeZone: 'Australia/Brisbane',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const LONG_DATE = new Intl.DateTimeFormat('en-AU', {
  timeZone: 'UTC',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/** Brisbane calendar date as YYYY-MM-DD; parts are assembled manually so locale separators never matter. */
export function toBrisbaneIsoDate(d: Date): string {
  const parts = BRISBANE_DATE.formatToParts(d);
  const get = (type: string): string => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function isValidIsoDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toISOString().slice(0, 10) === s;
}

/** "25 October 2026" from YYYY-MM-DD; noon UTC avoids any timezone day drift. */
export function formatDeletionDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return LONG_DATE.format(new Date(Date.UTC(y, m - 1, d, 12)));
}

export function formatBrisbaneDateTime(d: Date): string {
  return `${BRISBANE_DATE_TIME.format(d)} (Brisbane time)`;
}
