import { useState } from 'react';
import { useParams, useNavigate, useOutletContext, Link } from 'react-router-dom';
import { pdf } from '@react-pdf/renderer';
import { format, parseISO } from 'date-fns';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { InvoicePreview } from '../../components/invoice/InvoicePreview';
import { InvoicePDF } from '../../components/invoice/InvoicePDF';
import { STATUS_COLORS } from '../../constants/defaults';

function toDateInputValue(isoString) {
  if (!isoString) return '';
  return format(parseISO(isoString), 'yyyy-MM-dd');
}

function toISOFromDateInput(value) {
  if (!value) return null;
  return new Date(value + 'T00:00:00').toISOString();
}

export function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { invoices, updateInvoice, deleteInvoice } = useOutletContext();
  const [pdfLoading, setPdfLoading] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);

  const invoice = invoices.find(inv => inv.id === id);

  if (!invoice) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 mb-4">Invoice not found.</p>
        <Link to="/invoices"><Button variant="outline">Back to Invoices</Button></Link>
      </div>
    );
  }

  function startEdit() {
    setEditForm({
      invoiceNumber: invoice.invoiceNumber,
      issuedAt: toDateInputValue(invoice.issuedAt),
      dueAt: toDateInputValue(invoice.dueAt),
      serviceDescription: invoice.serviceDescription,
      hoursWorked: String(invoice.hoursWorked),
      businessDays: String(invoice.businessDays),
      notes: invoice.notes,
    });
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setEditForm(null);
  }

  async function handleSave() {
    const hoursWorked = Number(editForm.hoursWorked) || 0;
    const subtotal = hoursWorked * invoice.hourlyRate;
    const total = subtotal;

    await updateInvoice(invoice.id, {
      invoiceNumber: editForm.invoiceNumber,
      issuedAt: toISOFromDateInput(editForm.issuedAt),
      dueAt: toISOFromDateInput(editForm.dueAt),
      serviceDescription: editForm.serviceDescription,
      hoursWorked,
      businessDays: Number(editForm.businessDays) || 0,
      subtotal,
      total,
      notes: editForm.notes,
    });
    setEditing(false);
    setEditForm(null);
  }

  function set(field) {
    return e => setEditForm(prev => ({ ...prev, [field]: e.target.value }));
  }

  async function handleDownload() {
    setPdfLoading(true);
    try {
      const blob = await pdf(<InvoicePDF invoice={invoice} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoice.invoiceNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setPdfLoading(false);
    }
  }

  function handleStatusChange(newStatus) {
    const updates = { status: newStatus };
    if (newStatus === 'paid' && !invoice.paidAt) updates.paidAt = new Date().toISOString();
    updateInvoice(invoice.id, updates);
  }

  const hoursPreview = editForm ? Number(editForm.hoursWorked) || 0 : 0;
  const totalPreview = hoursPreview * invoice.hourlyRate;

  return (
    <div>
      <PageHeader
        title={invoice.invoiceNumber}
        subtitle={`${invoice.projectName} · ${invoice.billingMonth}`}
        action={
          <div className="flex items-center gap-2">
            <Badge color={STATUS_COLORS[invoice.status]}>{invoice.status}</Badge>
            {!editing && invoice.status === 'draft' && (
              <Button size="sm" variant="secondary" onClick={() => handleStatusChange('sent')}>
                Mark Sent
              </Button>
            )}
            {!editing && invoice.status === 'sent' && (
              <Button size="sm" variant="secondary" onClick={() => handleStatusChange('paid')}>
                Mark Paid
              </Button>
            )}
            {!editing && invoice.status === 'paid' && (
              <Button size="sm" variant="outline" onClick={() => handleStatusChange('sent')}>
                Mark Unpaid
              </Button>
            )}
            {editing ? (
              <>
                <Button size="sm" onClick={handleSave}>Save</Button>
                <Button size="sm" variant="outline" onClick={cancelEdit}>Cancel</Button>
              </>
            ) : (
              <>
                <Button size="sm" variant="secondary" onClick={startEdit}>Edit</Button>
                <Button
                  size="sm"
                  onClick={handleDownload}
                  disabled={pdfLoading}
                  className="min-w-[120px]"
                >
                  {pdfLoading ? 'Generating…' : 'Download PDF'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowDelete(true)} className="text-red-500 hover:bg-red-50">
                  Delete
                </Button>
              </>
            )}
          </div>
        }
      />

      {editing ? (
        <div className="max-w-2xl space-y-5">
          <Card className="p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Invoice Details</h2>
            <Input
              label="Invoice Number"
              value={editForm.invoiceNumber}
              onChange={set('invoiceNumber')}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Issued Date"
                type="date"
                value={editForm.issuedAt}
                onChange={set('issuedAt')}
              />
              <Input
                label="Due Date"
                type="date"
                value={editForm.dueAt}
                onChange={set('dueAt')}
              />
            </div>
            <Input
              label="Service Description"
              value={editForm.serviceDescription}
              onChange={set('serviceDescription')}
            />
          </Card>

          <Card className="p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Hours</h2>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Business Days"
                type="number"
                min="0"
                step="1"
                value={editForm.businessDays}
                onChange={set('businessDays')}
              />
              <Input
                label="Hours Worked"
                type="number"
                min="0"
                step="0.5"
                value={editForm.hoursWorked}
                onChange={set('hoursWorked')}
              />
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-sm flex justify-between">
              <span className="text-gray-600">Recalculated total ({invoice.currency} {invoice.hourlyRate}/hr)</span>
              <span className="font-semibold text-orange-600">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: invoice.currency }).format(totalPreview)}
              </span>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Notes</h2>
            <textarea
              value={editForm.notes}
              onChange={set('notes')}
              rows={3}
              placeholder="Payment instructions, bank details, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            />
          </Card>
        </div>
      ) : (
        <InvoicePreview invoice={invoice} />
      )}

      <ConfirmDialog
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={() => { deleteInvoice(invoice.id); navigate('/invoices'); }}
        title="Delete Invoice"
        message={`Are you sure you want to delete ${invoice.invoiceNumber}? This cannot be undone.`}
      />
    </div>
  );
}
