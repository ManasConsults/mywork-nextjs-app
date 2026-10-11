import {
  ACCOUNT_DELETION_GRACE_MS,
  computeDeletionDueAt,
  formatBrisbaneDateTime,
  formatDeletionDate,
  isDeletionDue,
  isValidIsoDate,
  toBrisbaneIsoDate,
} from './deletion';

const DAY = 24 * 60 * 60 * 1000;
const at = (iso: string): string => computeDeletionDueAt(new Date(iso)).toISOString();

describe('computeDeletionDueAt', () => {
  it('is exactly 14 x 24h after the request', () => {
    const t = new Date('2026-10-11T03:41:22.123Z');
    expect(computeDeletionDueAt(t).getTime() - t.getTime()).toBe(14 * DAY);
    expect(ACCOUNT_DELETION_GRACE_MS).toBe(14 * DAY);
  });

  it('rolls over a month end', () => {
    expect(at('2026-10-25T20:00:00.000Z')).toBe('2026-11-08T20:00:00.000Z');
  });

  it('rolls over a year end', () => {
    expect(at('2026-12-25T18:00:00.000Z')).toBe('2027-01-08T18:00:00.000Z');
  });

  it('shows the Brisbane date, which can be a day after the UTC date', () => {
    // Due 2026-10-25T15:00Z is already 26 October (01:00) in Brisbane.
    expect(toBrisbaneIsoDate(computeDeletionDueAt(new Date('2026-10-11T15:00:00.000Z')))).toBe('2026-10-26');
    // Due 2026-10-25T13:59Z is still 25 October (23:59) in Brisbane.
    expect(toBrisbaneIsoDate(computeDeletionDueAt(new Date('2026-10-11T13:59:00.000Z')))).toBe('2026-10-25');
  });
});

describe('isDeletionDue', () => {
  const requestedAt = new Date('2026-10-11T03:00:00.000Z');
  const due = requestedAt.getTime() + 14 * DAY;

  it('is not due 1ms before the 14 days end', () => {
    expect(isDeletionDue(requestedAt, new Date(due - 1))).toBe(false);
  });

  it('is due at exactly 14 x 24h', () => {
    expect(isDeletionDue(requestedAt, new Date(due))).toBe(true);
  });

  it('is due 1ms after', () => {
    expect(isDeletionDue(requestedAt, new Date(due + 1))).toBe(true);
  });
});

describe('toBrisbaneIsoDate', () => {
  it('formats 17:00 UTC as 03:00 the next Brisbane day', () => {
    expect(toBrisbaneIsoDate(new Date('2026-10-25T17:00:00.000Z'))).toBe('2026-10-26');
  });

  it('keeps the same day before 14:00 UTC', () => {
    expect(toBrisbaneIsoDate(new Date('2026-10-25T13:59:59.000Z'))).toBe('2026-10-25');
    expect(toBrisbaneIsoDate(new Date('2026-10-25T14:00:00.000Z'))).toBe('2026-10-26');
  });

  it('handles year rollover and has no DST shift in summer', () => {
    expect(toBrisbaneIsoDate(new Date('2027-01-09T17:00:00.000Z'))).toBe('2027-01-10');
    expect(toBrisbaneIsoDate(new Date('2026-12-31T14:00:00.000Z'))).toBe('2027-01-01');
  });
});

describe('isValidIsoDate', () => {
  it.each(['2026-10-26', '2028-02-29'])('accepts %s', (s) => {
    expect(isValidIsoDate(s)).toBe(true);
  });

  it.each(['2026-13-45', '2026-02-30', '2027-02-29', '2026-1-1', '26-10-26', '2026-10-26x', '', 'abcd-ef-gh'])(
    'rejects %s',
    (s) => {
      expect(isValidIsoDate(s)).toBe(false);
    },
  );
});

describe('formatting', () => {
  it('formats an ISO date as a long en-AU date', () => {
    expect(formatDeletionDate('2026-10-26')).toBe('26 October 2026');
    expect(formatDeletionDate('2027-01-01')).toBe('1 January 2027');
  });

  it('formats a Brisbane date and time', () => {
    const out = formatBrisbaneDateTime(new Date('2026-10-11T03:30:00.000Z'));
    expect(out).toContain('11 October 2026');
    expect(out).toContain('13:30');
    expect(out).toContain('Brisbane');
  });
});
