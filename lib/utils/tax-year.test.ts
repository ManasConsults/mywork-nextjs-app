import {
  TAX_YEAR_OPTION_COUNT,
  currentTaxYear,
  getTaxYearStart,
  parseTaxParams,
  taxYearLabel,
  taxYearOptions,
} from './tax-year';

describe('getTaxYearStart', () => {
  it('starts the Australian tax year on 1 July of the given year', () => {
    expect(getTaxYearStart('AU', 2025)).toEqual(new Date(2025, 6, 1));
  });
});

describe('currentTaxYear', () => {
  it('returns the previous year on 30 June', () => {
    expect(currentTaxYear('AU', new Date(2026, 5, 30, 23, 59))).toBe(2025);
  });

  it('rolls over on 1 July', () => {
    expect(currentTaxYear('AU', new Date(2026, 6, 1))).toBe(2026);
  });

  it('stays in the same tax year through December and into the new calendar year', () => {
    expect(currentTaxYear('AU', new Date(2026, 11, 31))).toBe(2026);
    expect(currentTaxYear('AU', new Date(2027, 0, 1))).toBe(2026);
  });
});

describe('taxYearLabel', () => {
  it('uses the ATO short form', () => {
    expect(taxYearLabel(2025)).toBe('2025–26');
  });

  it('pads the end year across a century boundary', () => {
    expect(taxYearLabel(2099)).toBe('2099–00');
  });
});

describe('taxYearOptions', () => {
  it('lists the current tax year first, then previous years', () => {
    const options = taxYearOptions('AU', new Date(2026, 9, 6));
    expect(options).toHaveLength(TAX_YEAR_OPTION_COUNT);
    expect(options[0]).toBe(2026);
    expect(options).toEqual([2026, 2025, 2024, 2023, 2022]);
  });
});

describe('parseTaxParams', () => {
  const now = new Date(2026, 9, 6);

  it('accepts a known region and an offered year', () => {
    expect(parseTaxParams('AU', '2024', now)).toEqual({ taxRegion: 'AU', taxYear: 2024 });
  });

  it('falls back to the default region and current year for missing params', () => {
    expect(parseTaxParams(null, undefined, now)).toEqual({ taxRegion: 'AU', taxYear: 2026 });
  });

  it('falls back for unknown regions and years outside the offered range', () => {
    expect(parseTaxParams('UK', 'uk-2025', now)).toEqual({ taxRegion: 'AU', taxYear: 2026 });
    expect(parseTaxParams('AU', '2010', now)).toEqual({ taxRegion: 'AU', taxYear: 2026 });
  });
});
