import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

import type { TaxSummaryResult, TaxTransaction } from '@/lib/services/finance/report.service';
import { fromMinorUnit } from '@/lib/utils/money';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TaxSummaryForPdf = {
  summary: TaxSummaryResult;
  currency: string;
  regionLabel: string;
  taxYearLabel: string;
  user: { name: string | null; businessName: string | null; abn: string | null };
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(date: Date): string {
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function sum(rows: { amount: number }[]): number {
  return rows.reduce((s, r) => s + r.amount, 0);
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 9, padding: 40, paddingBottom: 60, color: '#111827' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  businessName: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: '#0d9488' },
  muted: { fontSize: 9, color: '#6b7280', marginTop: 3 },
  title: { fontSize: 18, fontFamily: 'Helvetica-Bold', textAlign: 'right' },
  subtitle: { fontSize: 10, color: '#6b7280', textAlign: 'right', marginTop: 3 },
  disclaimer: { padding: 8, backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fde68a', borderRadius: 4, fontSize: 8, color: '#92400e', marginBottom: 16 },
  cards: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  card: { flex: 1, padding: 10, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 4 },
  cardLabel: { fontSize: 7, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', color: '#6b7280', letterSpacing: 0.5 },
  cardValue: { fontSize: 13, fontFamily: 'Helvetica-Bold', marginTop: 4 },
  sectionTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', marginBottom: 6, marginTop: 6 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f9fafb', paddingVertical: 5, paddingHorizontal: 6, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  th: { fontSize: 7, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', color: '#6b7280', letterSpacing: 0.5 },
  row: { flexDirection: 'row', paddingVertical: 4, paddingHorizontal: 6, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  totalRow: { flexDirection: 'row', paddingVertical: 5, paddingHorizontal: 6, backgroundColor: '#f9fafb', marginBottom: 14 },
  bold: { fontFamily: 'Helvetica-Bold' },
  colCategory: { flex: 3 },
  colDate: { width: 62 },
  colDesc: { flex: 3, paddingRight: 6 },
  colCat: { flex: 2, paddingRight: 6 },
  colAccount: { flex: 1.5, paddingRight: 6 },
  colAmount: { width: 72, textAlign: 'right' },
  empty: { fontSize: 9, color: '#6b7280', marginBottom: 14 },
  footer: { position: 'absolute', bottom: 24, left: 40, right: 40, borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 6, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 7, color: '#9ca3af' },
});

// ─── Sub-components ───────────────────────────────────────────────────────────

function CategoryTable({
  title,
  rows,
  currency,
}: {
  title: string;
  rows: { categoryName: string; amount: number }[];
  currency: string;
}): React.JSX.Element | null {
  if (rows.length === 0) return null;
  return (
    <View wrap={false}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.tableHeader}>
        <Text style={[styles.th, styles.colCategory]}>Category</Text>
        <Text style={[styles.th, styles.colAmount]}>Amount</Text>
      </View>
      {rows.map((r) => (
        <View key={r.categoryName} style={styles.row}>
          <Text style={styles.colCategory}>{r.categoryName}</Text>
          <Text style={styles.colAmount}>{fromMinorUnit(r.amount, currency)}</Text>
        </View>
      ))}
      <View style={styles.totalRow}>
        <Text style={[styles.colCategory, styles.bold]}>Total</Text>
        <Text style={[styles.colAmount, styles.bold]}>{fromMinorUnit(sum(rows), currency)}</Text>
      </View>
    </View>
  );
}

function ItemisedTable({
  title,
  rows,
  currency,
}: {
  title: string;
  rows: TaxTransaction[];
  currency: string;
}): React.JSX.Element {
  return (
    <View>
      <Text style={styles.sectionTitle} minPresenceAhead={40}>{title}</Text>
      {rows.length === 0 ? (
        <Text style={styles.empty}>No transactions.</Text>
      ) : (
        <>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, styles.colDate]}>Date</Text>
            <Text style={[styles.th, styles.colDesc]}>Description</Text>
            <Text style={[styles.th, styles.colCat]}>Category</Text>
            <Text style={[styles.th, styles.colAccount]}>Account</Text>
            <Text style={[styles.th, styles.colAmount]}>Amount</Text>
          </View>
          {rows.map((tx) => (
            <View key={tx.id} style={styles.row} wrap={false}>
              <Text style={styles.colDate}>{fmtDate(tx.date)}</Text>
              <Text style={styles.colDesc}>
                {tx.description ?? '—'}
                {tx.reference ? ` (Ref: ${tx.reference})` : ''}
              </Text>
              <Text style={styles.colCat}>{tx.categoryName}</Text>
              <Text style={styles.colAccount}>{tx.accountName}</Text>
              <Text style={styles.colAmount}>{fromMinorUnit(tx.amount, currency)}</Text>
            </View>
          ))}
          <View style={styles.totalRow} wrap={false}>
            <Text style={[styles.bold, { flex: 1 }]}>Total ({rows.length} transactions)</Text>
            <Text style={[styles.colAmount, styles.bold]}>{fromMinorUnit(sum(rows), currency)}</Text>
          </View>
        </>
      )}
    </View>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TaxSummaryTemplate({ data }: { data: TaxSummaryForPdf }): React.JSX.Element {
  const { summary, currency, user } = data;

  const businessIncomeTx = summary.transactions.filter((t) => t.categoryType === 'BUSINESS' && t.type === 'INCOME');
  const businessExpenseTx = summary.transactions.filter((t) => t.categoryType === 'BUSINESS' && t.type === 'EXPENSE');
  const workRelatedTx = summary.transactions.filter((t) => t.categoryType === 'WORK_RELATED');

  const cards = [
    { label: 'Business Income', value: summary.businessIncome },
    { label: 'Business Expenses', value: sum(summary.businessExpenses) },
    { label: 'Net Business Profit', value: summary.netBusinessProfit },
  ];

  return (
    <Document title={`Tax Summary ${data.taxYearLabel}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.businessName}>{user.businessName ?? user.name ?? 'Tax Summary'}</Text>
            {user.businessName && user.name && <Text style={styles.muted}>{user.name}</Text>}
            {user.abn && <Text style={styles.muted}>ABN: {user.abn}</Text>}
          </View>
          <View>
            <Text style={styles.title}>Tax Summary</Text>
            <Text style={styles.subtitle}>
              {data.regionLabel} · {data.taxYearLabel} tax year
            </Text>
            <Text style={styles.subtitle}>
              {fmtDate(summary.taxYearStart)} – {fmtDate(summary.taxYearEnd)}
            </Text>
          </View>
        </View>

        <Text style={styles.disclaimer}>
          This report is for reference only and does not constitute financial or tax advice.
          Amounts are in {currency}.
        </Text>

        <View style={styles.cards}>
          {cards.map((c) => (
            <View key={c.label} style={styles.card}>
              <Text style={styles.cardLabel}>{c.label}</Text>
              <Text style={styles.cardValue}>{fromMinorUnit(c.value, currency)}</Text>
            </View>
          ))}
        </View>

        <CategoryTable title="Business Income by Category" rows={summary.businessIncomeByCategory} currency={currency} />
        <CategoryTable title="Business Expenses by Category" rows={summary.businessExpenses} currency={currency} />
        <CategoryTable title="Work-Related Expenses by Category" rows={summary.workRelatedExpenses} currency={currency} />

        <View break>
          <ItemisedTable title="Business Income — Transactions" rows={businessIncomeTx} currency={currency} />
          <ItemisedTable title="Business Expenses — Transactions" rows={businessExpenseTx} currency={currency} />
          <ItemisedTable title="Work-Related Expenses — Transactions" rows={workRelatedTx} currency={currency} />
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Generated by MyWork on {fmtDate(new Date())}</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
