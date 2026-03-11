/**
 * Convert a decimal amount (e.g. 12.50) to minor currency units (e.g. 1250 pence).
 * All monetary values are stored as integers in the DB per AP-F1.
 */
export function toMinorUnit(decimal: number): number {
  return Math.round(decimal * 100);
}

/**
 * Format minor-unit integer (e.g. 1250) as a locale currency string (e.g. "£12.50").
 * Defaults to GBP if no currency code is provided.
 */
export function fromMinorUnit(minor: number, currency = 'GBP'): string {
  return (minor / 100).toLocaleString('en-GB', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
