import type { TaxTransaction } from '@/lib/services/finance/report.service';
import { buildTaxSummaryCsv } from './tax-summary-csv';

const base: TaxTransaction = {
  id: 'tx-1',
  date: new Date(2025, 7, 5),
  type: 'INCOME',
  categoryName: 'Consulting',
  categoryType: 'BUSINESS',
  description: 'Client A',
  reference: 'INV-001',
  accountName: 'Everyday',
  amount: 123456,
};

function lines(csv: string): string[] {
  return csv.replace(/^﻿/, '').trimEnd().split('\r\n');
}

describe('buildTaxSummaryCsv', () => {
  it('starts with a UTF-8 BOM and a header naming the currency', () => {
    const csv = buildTaxSummaryCsv([], 'AUD');
    expect(csv.startsWith('﻿')).toBe(true);
    expect(lines(csv)).toEqual([
      'Date,Type,Category,Category Type,Description,Reference,Account,Amount (AUD)',
    ]);
  });

  it('writes one row per transaction with ISO dates and plain decimal amounts', () => {
    const csv = buildTaxSummaryCsv(
      [base, { ...base, id: 'tx-2', type: 'EXPENSE', categoryType: 'WORK_RELATED', categoryName: 'Travel', reference: null, amount: 1500 }],
      'AUD',
    );
    expect(lines(csv).slice(1)).toEqual([
      '2025-08-05,Income,Consulting,Business,Client A,INV-001,Everyday,1234.56',
      '2025-08-05,Expense,Travel,Work Related,Client A,,Everyday,15.00',
    ]);
  });

  it('quotes cells containing commas, quotes or newlines', () => {
    const csv = buildTaxSummaryCsv([{ ...base, description: 'Lunch, "team"\nmeeting' }], 'AUD');
    expect(csv).toContain('"Lunch, ""team""\nmeeting"');
  });

  it('neutralises cells that a spreadsheet would run as formulas', () => {
    const csv = buildTaxSummaryCsv([{ ...base, description: '=HYPERLINK("x")', reference: '+61' }], 'AUD');
    const row = lines(csv)[1];
    expect(row).toContain(`"'=HYPERLINK(""x"")"`);
    expect(row).toContain(`'+61`);
  });

  it('writes an empty cell for a missing description', () => {
    const csv = buildTaxSummaryCsv([{ ...base, description: null }], 'AUD');
    expect(lines(csv)[1]).toBe('2025-08-05,Income,Consulting,Business,,INV-001,Everyday,1234.56');
  });
});
