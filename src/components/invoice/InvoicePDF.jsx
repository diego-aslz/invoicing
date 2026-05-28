import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const S = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 10, padding: 48, color: '#1f2937', backgroundColor: '#ffffff' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  invoiceNum: { fontSize: 24, fontFamily: 'Helvetica-Bold', color: '#111827' },
  label: { fontSize: 7, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 },
  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 7, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  bold: { fontFamily: 'Helvetica-Bold' },
  gray: { color: '#6b7280' },
  metaBox: { flexDirection: 'row', backgroundColor: '#f9fafb', padding: 10, borderRadius: 4, marginBottom: 24, gap: 20 },
  metaItem: { flex: 1 },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1.5, borderBottomColor: '#e5e7eb', paddingBottom: 5, marginBottom: 4 },
  tableRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: '#f3f4f6' },
  col_desc: { flex: 4 },
  col_hours: { flex: 1, textAlign: 'right' },
  col_rate: { flex: 1.5, textAlign: 'right' },
  col_amount: { flex: 1.5, textAlign: 'right' },
  colHead: { fontSize: 7, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 },
  totalsRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  totalsBox: { width: 200 },
  totalLine: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  grandTotal: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderTopWidth: 1, borderTopColor: '#e5e7eb', marginTop: 4 },
  grandTotalText: { fontFamily: 'Helvetica-Bold', fontSize: 12, color: '#f97316' },
  statusBadge: { fontSize: 8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, textTransform: 'uppercase', letterSpacing: 1 },
  notes: { borderTopWidth: 0.5, borderTopColor: '#e5e7eb', paddingTop: 16, marginTop: 24 },
});

function fmt(amount, currency) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function statusBgColor(status) {
  if (status === 'paid') return '#dcfce7';
  if (status === 'sent') return '#dbeafe';
  return '#f3f4f6';
}
function statusTextColor(status) {
  if (status === 'paid') return '#166534';
  if (status === 'sent') return '#1d4ed8';
  return '#4b5563';
}

export function InvoicePDF({ invoice }) {
  const {
    invoiceNumber, billingMonth, status,
    businessName, businessAddress,
    clientName, clientAddress,
    issuedAt, dueAt,
    serviceDescription, hoursWorked, hourlyRate, subtotal, total, currency,
    notes, lineItems,
  } = invoice;

  const hasLineItems = lineItems && lineItems.length > 0;

  return (
    <Document>
      <Page size="A4" style={S.page}>
        {/* Header */}
        <View style={[S.row, S.section]}>
          <View>
            <Text style={S.invoiceNum}>{invoiceNumber}</Text>
            <Text style={S.label}>Invoice</Text>
          </View>
        </View>

        {/* Sender / Receiver */}
        <View style={[S.row, S.section]}>
          <View style={{ flex: 1, marginRight: 20 }}>
            <Text style={S.sectionTitle}>From</Text>
            <Text style={S.bold}>{businessName || 'Your Business'}</Text>
            <Text style={S.gray}>{businessAddress}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={S.sectionTitle}>Bill To</Text>
            <Text style={S.bold}>{clientName || 'Client'}</Text>
            <Text style={S.gray}>{clientAddress}</Text>
          </View>
        </View>

        {/* Dates meta */}
        <View style={S.metaBox}>
          <View style={S.metaItem}>
            <Text style={S.label}>Issued</Text>
            <Text style={S.bold}>{fmtDate(issuedAt)}</Text>
          </View>
          <View style={S.metaItem}>
            <Text style={S.label}>Due</Text>
            <Text style={S.bold}>{fmtDate(dueAt)}</Text>
          </View>
          <View style={S.metaItem}>
            <Text style={S.label}>Period</Text>
            <Text style={S.bold}>{billingMonth}</Text>
          </View>
        </View>

        {/* Line items */}
        <View style={S.tableHeader}>
          <Text style={[S.col_desc, S.colHead]}>Description</Text>
          <Text style={[S.col_hours, S.colHead]}>Hours</Text>
          <Text style={[S.col_rate, S.colHead]}>Rate</Text>
          <Text style={[S.col_amount, S.colHead]}>Amount</Text>
        </View>
        {hasLineItems ? (
          lineItems.map((item, i) => (
            <View key={i} style={S.tableRow}>
              <Text style={S.col_desc}>{item.description}</Text>
              <Text style={[S.col_hours, { textAlign: 'right' }]}>{parseFloat(item.hours.toFixed(2))}</Text>
              <Text style={[S.col_rate, { textAlign: 'right' }]}>{fmt(item.rate, currency)}</Text>
              <Text style={[S.col_amount, S.bold, { textAlign: 'right' }]}>{fmt(item.amount, currency)}</Text>
            </View>
          ))
        ) : (
          <View style={S.tableRow}>
            <Text style={S.col_desc}>{serviceDescription}</Text>
            <Text style={[S.col_hours, { textAlign: 'right' }]}>{parseFloat(hoursWorked.toFixed(2))}</Text>
            <Text style={[S.col_rate, { textAlign: 'right' }]}>{fmt(hourlyRate, currency)}</Text>
            <Text style={[S.col_amount, S.bold, { textAlign: 'right' }]}>{fmt(subtotal, currency)}</Text>
          </View>
        )}

        {/* Totals */}
        <View style={S.totalsRow}>
          <View style={S.totalsBox}>
            <View style={S.totalLine}>
              <Text style={S.gray}>Subtotal</Text>
              <Text>{fmt(subtotal, currency)}</Text>
            </View>
            <View style={S.grandTotal}>
              <Text style={[S.bold, { fontSize: 11 }]}>Total</Text>
              <Text style={S.grandTotalText}>{fmt(total, currency)}</Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        {notes ? (
          <View style={S.notes}>
            <Text style={S.label}>Notes</Text>
            <Text style={S.gray}>{notes}</Text>
          </View>
        ) : null}
      </Page>
    </Document>
  );
}
