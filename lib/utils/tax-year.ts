/**
 * Tax-year utilities for the Finance tax summary report (FR-FIN-16).
 *
 * A tax year is identified by its *starting* calendar year: AU 2025 = 1 Jul 2025 – 30 Jun 2026,
 * labelled "2025–26" as the ATO does.
 */

export const TAX_REGIONS = {
  AU: { label: 'Australia', startMonth: 7, startDay: 1 }, // startMonth is 1–12
} as const;

export type TaxRegion = keyof typeof TAX_REGIONS;

export const TAX_REGION_CODES = Object.keys(TAX_REGIONS) as [TaxRegion, ...TaxRegion[]];

export const DEFAULT_TAX_REGION: TaxRegion = 'AU';

/** How many tax years (current + previous) the report lets the user pick from. */
export const TAX_YEAR_OPTION_COUNT = 5;

export function getTaxYearStart(region: TaxRegion, year: number): Date {
  const { startMonth, startDay } = TAX_REGIONS[region];
  return new Date(year, startMonth - 1, startDay);
}

export function currentTaxYear(region: TaxRegion, now: Date = new Date()): number {
  const year = now.getFullYear();
  return now >= getTaxYearStart(region, year) ? year : year - 1;
}

export function taxYearLabel(year: number): string {
  return `${year}–${String(year + 1).slice(-2)}`;
}

/** Newest first, starting at the tax year that contains `now`. */
export function taxYearOptions(region: TaxRegion, now: Date = new Date()): number[] {
  const current = currentTaxYear(region, now);
  return Array.from({ length: TAX_YEAR_OPTION_COUNT }, (_, i) => current - i);
}
