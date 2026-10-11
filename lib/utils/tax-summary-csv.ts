import type { TaxTransaction } from '@/lib/services/finance/report.service';

const HEADERS = ['Date', 'Type', 'Category', 'Category Type', 'Description', 'Reference', 'Account'];

const TYPE_LABELS: Record<TaxTransaction['type'], string> = { INCOME: 'Income', EXPENSE: 'Expense' };
const CATEGORY_TYPE_LABELS: Record<TaxTransaction['categoryType'], string> = {
  BUSINESS: 'Business',
  WORK_RELATED: 'Work Related',
};

function escapeCell(value: string): string {
  // Spreadsheets execute cells starting with these as formulas; the accountant opens this file in Excel
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

function isoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * One row per transaction. Amounts are plain decimals (no symbol, always positive) so they
 * import cleanly into accounting software; the Type column carries the direction.
 */
export function buildTaxSummaryCsv(transactions: TaxTransaction[], currency: string): string {
  const header = [...HEADERS, `Amount (${currency})`].map(escapeCell).join(',');
  const rows = transactions.map((tx) =>
    [
      isoDate(tx.date),
      TYPE_LABELS[tx.type],
      tx.categoryName,
      CATEGORY_TYPE_LABELS[tx.categoryType],
      tx.description ?? '',
      tx.reference ?? '',
      tx.accountName,
      (tx.amount / 100).toFixed(2),
    ]
      .map(escapeCell)
      .join(','),
  );
  // BOM so Excel detects UTF-8 instead of mangling non-ASCII descriptions
  return `﻿${[header, ...rows].join('\r\n')}\r\n`;
}
