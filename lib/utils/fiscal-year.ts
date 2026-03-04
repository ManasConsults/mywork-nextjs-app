/**
 * Fiscal year utilities.
 *
 * The "year" label always refers to the *ending* calendar year of a fiscal period.
 * Examples with startMonth=4 (April):
 *   FY 2026 = 1 Apr 2025 – 31 Mar 2026
 * Examples with startMonth=1 (January):
 *   FY 2026 = 1 Jan 2026 – 31 Dec 2026
 */

export function getFiscalYearRange(
  year: number,
  startMonth: number, // 1–12
): { from: Date; to: Date } {
  if (startMonth === 1) {
    return {
      from: new Date(year, 0, 1),           // Jan 1
      to: new Date(year, 11, 31, 23, 59, 59, 999), // Dec 31
    };
  }
  // FY ending in `year`: starts in (year-1) at startMonth, ends in `year` at (startMonth-1)
  const fromYear = year - 1;
  const toMonth = startMonth - 1; // 0-indexed month of last month in FY

  const from = new Date(fromYear, startMonth - 1, 1); // e.g. Apr 1 of prev year
  // Last day of toMonth in `year`
  const to = new Date(year, toMonth, 0, 23, 59, 59, 999); // day 0 = last day of prev month

  return { from, to };
}

export function currentFiscalYear(startMonth: number): number {
  const now = new Date();
  const month = now.getMonth() + 1; // 1–12
  const calYear = now.getFullYear();

  if (startMonth === 1) return calYear;

  // If current month is >= startMonth, we are in the FY that ends next year
  return month >= startMonth ? calYear + 1 : calYear;
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export function fiscalYearLabel(year: number, startMonth: number): string {
  if (startMonth === 1) return `FY ${year}`;
  const fromYear = year - 1;
  const endMonthIndex = startMonth - 2; // 0-indexed month before startMonth
  const endMonthName = MONTH_NAMES[endMonthIndex];
  const startMonthName = MONTH_NAMES[startMonth - 1];
  return `${startMonthName} ${fromYear} – ${endMonthName} ${year}`;
}
