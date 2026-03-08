import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
// ─── Types ────────────────────────────────────────────────────────────────────

export type InvoiceForPdf = {
  invoiceNumber: string;
  issueDate: Date;
  dueDate: Date | null;
  notes: string | null;
  taxRate: number;      // basis points (2000 = 20%)
  subtotal: number;     // minor units
  taxAmount: number;    // minor units
  total: number;        // minor units
  currency: string;
  client: {
    name: string;
    email: string | null;
    address: string | null;
  };
  user: {
    name: string | null;
    email: string | null;
    businessName: string | null;
    abn: string | null;
    businessEmail: string | null;
    businessPhone: string | null;
    businessAddress: string | null;
  };
  paymentAccount: {
    name: string;
    bankName: string | null;
    accountNumber: string | null;
    bsb: string | null;
    iban: string | null;
    swiftBic: string | null;
  } | null;
  lineItems: {
    description: string;
    quantity: number;
    unitPrice: number;   // minor units
    total: number;       // minor units
    sortOrder: number;
  }[];
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(minor: number, currency = 'GBP'): string {
  return (minor / 100).toLocaleString('en-GB', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtDate(date: Date): string {
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 10, padding: 48, color: '#111827' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
  businessName: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#0d9488' },
  userInfo: { fontSize: 9, color: '#6b7280', marginTop: 4 },
  invoiceLabel: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: '#111827', textAlign: 'right' },
  invoiceNumber: { fontSize: 11, color: '#6b7280', textAlign: 'right', marginTop: 4 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', color: '#9ca3af', letterSpacing: 1, marginBottom: 6 },
  billTo: { fontSize: 10, color: '#111827', lineHeight: 1.5 },
  metaRow: { flexDirection: 'row', gap: 32, marginBottom: 20 },
  metaItem: { flex: 1 },
  metaLabel: { fontSize: 8, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', color: '#9ca3af', letterSpacing: 1, marginBottom: 3 },
  metaValue: { fontSize: 10, color: '#111827' },
  divider: { borderBottomWidth: 1, borderBottomColor: '#e5e7eb', marginBottom: 16 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f9fafb', padding: 8, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  tableHeaderText: { fontSize: 8, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', color: '#6b7280', letterSpacing: 0.5 },
  tableRow: { flexDirection: 'row', padding: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  tableCell: { fontSize: 10, color: '#111827' },
  colDesc: { flex: 3 },
  colQty: { flex: 1, textAlign: 'right' },
  colUnit: { flex: 1, textAlign: 'right' },
  colTotal: { flex: 1, textAlign: 'right' },
  totalsSection: { alignItems: 'flex-end', marginTop: 16 },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', width: 220, marginBottom: 4 },
  totalsLabel: { fontSize: 10, color: '#6b7280' },
  totalsValue: { fontSize: 10, color: '#111827', textAlign: 'right' },
  totalRowBold: { borderTopWidth: 1, borderTopColor: '#111827', paddingTop: 6, marginTop: 4 },
  totalLabelBold: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#111827' },
  totalValueBold: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#111827', textAlign: 'right' },
  payment: { marginTop: 24, padding: 12, backgroundColor: '#f0fdf4', borderRadius: 4, borderWidth: 1, borderColor: '#bbf7d0' },
  paymentTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', color: '#166534', letterSpacing: 1, marginBottom: 6 },
  paymentRow: { flexDirection: 'row', marginBottom: 3 },
  paymentLabel: { fontSize: 9, color: '#6b7280', width: 90 },
  paymentValue: { fontSize: 9, color: '#111827' },
  paymentRef: { marginTop: 8, fontSize: 9, color: '#166534' },
  notes: { marginTop: 16, padding: 12, backgroundColor: '#f9fafb', borderRadius: 4 },
  notesTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', color: '#9ca3af', letterSpacing: 1, marginBottom: 6 },
  notesText: { fontSize: 9, color: '#6b7280', lineHeight: 1.6 },
  footer: { position: 'absolute', bottom: 32, left: 48, right: 48, borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 8 },
  footerText: { fontSize: 8, color: '#9ca3af', textAlign: 'center' },
});

// ─── Component ────────────────────────────────────────────────────────────────

export function InvoiceTemplate({ invoice }: { invoice: InvoiceForPdf }): React.JSX.Element {
  const taxRatePercent = invoice.taxRate / 100; // basis points → percent
  const sortedItems = [...invoice.lineItems].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.businessName}>
              {invoice.user.businessName ?? invoice.user.name ?? 'Invoice'}
            </Text>
            {invoice.user.abn && (
              <Text style={styles.userInfo}>ABN: {invoice.user.abn}</Text>
            )}
            {invoice.user.businessAddress && (
              <Text style={styles.userInfo}>{invoice.user.businessAddress}</Text>
            )}
            {(invoice.user.businessEmail ?? invoice.user.email) && (
              <Text style={styles.userInfo}>
                {invoice.user.businessEmail ?? invoice.user.email}
              </Text>
            )}
            {invoice.user.businessPhone && (
              <Text style={styles.userInfo}>{invoice.user.businessPhone}</Text>
            )}
          </View>
          <View>
            <Text style={styles.invoiceLabel}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
          </View>
        </View>

        {/* Bill To + Dates */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.sectionTitle}>Bill To</Text>
            <Text style={styles.billTo}>{invoice.client.name}</Text>
            {invoice.client.email && <Text style={styles.userInfo}>{invoice.client.email}</Text>}
            {invoice.client.address && <Text style={styles.userInfo}>{invoice.client.address}</Text>}
          </View>
          <View style={styles.metaItem}>
            <View style={{ marginBottom: 12 }}>
              <Text style={styles.metaLabel}>Issue Date</Text>
              <Text style={styles.metaValue}>{fmtDate(invoice.issueDate)}</Text>
            </View>
            {invoice.dueDate && (
              <View>
                <Text style={styles.metaLabel}>Due Date</Text>
                <Text style={styles.metaValue}>{fmtDate(invoice.dueDate)}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.divider} />

        {/* Line Items Table */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.colDesc]}>Description</Text>
          <Text style={[styles.tableHeaderText, styles.colQty]}>Qty</Text>
          <Text style={[styles.tableHeaderText, styles.colUnit]}>Unit Price</Text>
          <Text style={[styles.tableHeaderText, styles.colTotal]}>Total</Text>
        </View>

        {sortedItems.map((item, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.colDesc]}>{item.description}</Text>
            <Text style={[styles.tableCell, styles.colQty]}>
              {Number(item.quantity).toFixed(2)}
            </Text>
            <Text style={[styles.tableCell, styles.colUnit]}>
              {fmt(item.unitPrice, invoice.currency)}
            </Text>
            <Text style={[styles.tableCell, styles.colTotal]}>
              {fmt(item.total, invoice.currency)}
            </Text>
          </View>
        ))}

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Subtotal</Text>
            <Text style={styles.totalsValue}>{fmt(invoice.subtotal, invoice.currency)}</Text>
          </View>
          {invoice.taxRate > 0 && (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Tax ({taxRatePercent.toFixed(0)}%)</Text>
              <Text style={styles.totalsValue}>{fmt(invoice.taxAmount, invoice.currency)}</Text>
            </View>
          )}
          <View style={[styles.totalsRow, styles.totalRowBold]}>
            <Text style={styles.totalLabelBold}>Total</Text>
            <Text style={styles.totalValueBold}>{fmt(invoice.total, invoice.currency)}</Text>
          </View>
        </View>

        {/* Payment Details */}
        {invoice.paymentAccount && (
          <View style={styles.payment}>
            <Text style={styles.paymentTitle}>Payment Details</Text>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Account Name</Text>
              <Text style={styles.paymentValue}>{invoice.paymentAccount.name}</Text>
            </View>
            {invoice.paymentAccount.bankName && (
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Bank</Text>
                <Text style={styles.paymentValue}>{invoice.paymentAccount.bankName}</Text>
              </View>
            )}
            {invoice.paymentAccount.bsb && (
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>BSB</Text>
                <Text style={styles.paymentValue}>{invoice.paymentAccount.bsb}</Text>
              </View>
            )}
            {invoice.paymentAccount.accountNumber && (
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Account Number</Text>
                <Text style={styles.paymentValue}>{invoice.paymentAccount.accountNumber}</Text>
              </View>
            )}
            {invoice.paymentAccount.iban && (
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>IBAN</Text>
                <Text style={styles.paymentValue}>{invoice.paymentAccount.iban}</Text>
              </View>
            )}
            {invoice.paymentAccount.swiftBic && (
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>SWIFT / BIC</Text>
                <Text style={styles.paymentValue}>{invoice.paymentAccount.swiftBic}</Text>
              </View>
            )}
            <Text style={styles.paymentRef}>
              Please use <Text style={{ fontFamily: 'Helvetica-Bold' }}>{invoice.invoiceNumber}</Text> as the payment reference.
            </Text>
          </View>
        )}

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.notes}>
            <Text style={styles.notesTitle}>Notes / Payment Terms</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            {invoice.invoiceNumber} · Generated by MyWork
          </Text>
        </View>

      </Page>
    </Document>
  );
}
