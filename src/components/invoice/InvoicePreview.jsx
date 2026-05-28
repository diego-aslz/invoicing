import { format } from 'date-fns';

function fmt(amount, currency) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

export function InvoicePreview({ invoice }) {
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
    <div className="bg-white rounded-xl border border-gray-200 shadow p-10 max-w-2xl mx-auto font-sans text-sm text-gray-800">
      {/* Header */}
      <div className="flex justify-between items-start mb-10">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">{invoiceNumber}</h1>
          <p className="text-gray-500 text-xs uppercase tracking-wide">Invoice</p>
        </div>
        <div className="text-right">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${
            status === 'paid' ? 'bg-green-100 text-green-700' :
            status === 'sent' ? 'bg-blue-100 text-blue-700' :
            'bg-gray-100 text-gray-600'
          }`}>
            {status}
          </span>
        </div>
      </div>

      {/* Sender / Receiver */}
      <div className="grid grid-cols-2 gap-8 mb-10">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">From</p>
          <p className="font-semibold text-gray-900">{businessName || 'Your Business'}</p>
          <p className="text-gray-600 whitespace-pre-line">{businessAddress}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Bill To</p>
          <p className="font-semibold text-gray-900">{clientName || 'Client'}</p>
          <p className="text-gray-600 whitespace-pre-line">{clientAddress}</p>
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-3 gap-4 mb-10 bg-gray-50 rounded-lg p-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400 mb-0.5">Issued</p>
          <p className="font-medium">{issuedAt ? format(new Date(issuedAt), 'MMM d, yyyy') : '—'}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400 mb-0.5">Due</p>
          <p className="font-medium">{dueAt ? format(new Date(dueAt), 'MMM d, yyyy') : '—'}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400 mb-0.5">Period</p>
          <p className="font-medium">{billingMonth}</p>
        </div>
      </div>

      {/* Line items */}
      <table className="w-full mb-8">
        <thead>
          <tr className="border-b-2 border-gray-200">
            <th className="text-left py-2 text-xs uppercase tracking-wide text-gray-400 font-medium">Description</th>
            <th className="text-right py-2 text-xs uppercase tracking-wide text-gray-400 font-medium">Hours</th>
            <th className="text-right py-2 text-xs uppercase tracking-wide text-gray-400 font-medium">Rate</th>
            <th className="text-right py-2 text-xs uppercase tracking-wide text-gray-400 font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {hasLineItems ? (
            lineItems.map((item, i) => (
              <tr key={i} className="border-b border-gray-100">
                <td className="py-3 text-gray-800">{item.description}</td>
                <td className="py-3 text-right text-gray-700">{item.hours}</td>
                <td className="py-3 text-right text-gray-700">{fmt(item.rate, currency)}</td>
                <td className="py-3 text-right font-medium text-gray-900">{fmt(item.amount, currency)}</td>
              </tr>
            ))
          ) : (
            <tr className="border-b border-gray-100">
              <td className="py-3 text-gray-800">{serviceDescription}</td>
              <td className="py-3 text-right text-gray-700">{hoursWorked}</td>
              <td className="py-3 text-right text-gray-700">{fmt(hourlyRate, currency)}</td>
              <td className="py-3 text-right font-medium text-gray-900">{fmt(subtotal, currency)}</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-64 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span>{fmt(subtotal, currency)}</span>
          </div>
          <div className="flex justify-between font-bold text-base border-t border-gray-200 pt-2">
            <span>Total</span>
            <span className="text-orange-600">{fmt(total, currency)}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {notes && (
        <div className="border-t border-gray-200 pt-6">
          <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">Notes</p>
          <p className="text-gray-600 whitespace-pre-line">{notes}</p>
        </div>
      )}
    </div>
  );
}
