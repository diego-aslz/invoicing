import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { addDays, format } from 'date-fns';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { calculateBillableHours } from '../../utils/businessDays';
import { formatInvoiceNumber } from '../../utils/invoiceNumber';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

function getMonthOptions() {
  const opts = [];
  const now = new Date();
  for (let i = 0; i < 13; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    opts.push({ year: d.getFullYear(), month: d.getMonth() });
  }
  return opts;
}

export function InvoiceCreate() {
  const navigate = useNavigate();
  const { projects, addInvoice, settings, timeEntries } = useOutletContext();

  const activeProjects = projects.filter(p => p.isActive);
  const monthOptions = getMonthOptions();

  const [projectId, setProjectId] = useState(activeProjects[0]?.id || '');
  const [billingYear, setBillingYear] = useState(monthOptions[1]?.year ?? new Date().getFullYear());
  const [billingMonth, setBillingMonth] = useState(monthOptions[1]?.month ?? new Date().getMonth() - 1);
  const [serviceDescription, setServiceDescription] = useState(settings.defaultServiceDescription || '');
  const [notes, setNotes] = useState('');
  const [hoursOverride, setHoursOverride] = useState('');

  const project = projects.find(p => p.id === projectId);
  const { businessDays, hours: calcHours } = calculateBillableHours(billingYear, billingMonth);
  const billingMonthStr = `${billingYear}-${String(billingMonth + 1).padStart(2, '0')}`;

  // Check for time entries for selected project + month
  const monthEntries = timeEntries.filter(
    e => e.projectId === projectId && e.date.startsWith(billingMonthStr)
  );
  const hasTimeEntries = monthEntries.length > 0;
  const sortedEntries = [...monthEntries].sort((a, b) => a.date.localeCompare(b.date));

  const hoursWorked = hasTimeEntries
    ? monthEntries.reduce((sum, e) => sum + e.hours, 0)
    : (hoursOverride !== '' ? Number(hoursOverride) : calcHours);

  const hourlyRate = project ? project.hourlyRate : 0;
  const subtotal = hoursWorked * hourlyRate;
  const total = subtotal;

  function handleMonthChange(e) {
    const [y, m] = e.target.value.split('-').map(Number);
    setBillingYear(y);
    setBillingMonth(m);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!project) return;

    const now = new Date();
    const dueAt = addDays(now, settings.paymentTermsDays);

    const invoice = {
      projectId: project.id,
      projectName: project.name,
      status: 'draft',
      billingMonth: billingMonthStr,
      serviceDescription: serviceDescription || `Consulting services — ${MONTHS[billingMonth]} ${billingYear}`,
      businessDays,
      hoursWorked,
      hourlyRate,
      subtotal,
      total,
      notes,
      businessName: settings.businessName,
      businessAddress: settings.businessAddress,
      clientName: settings.clientName,
      clientAddress: settings.clientAddress,
      currency: project.currency,
      issuedAt: now.toISOString(),
      dueAt: dueAt.toISOString(),
      paidAt: null,
    };

    if (hasTimeEntries) {
      invoice.lineItems = sortedEntries.map(entry => ({
        description: `${format(new Date(entry.date + 'T00:00:00'), 'MMM d, yyyy')}${entry.comment ? ' — ' + entry.comment : ''}`,
        hours: entry.hours,
        rate: hourlyRate,
        amount: entry.hours * hourlyRate,
      }));
    }

    await addInvoice(invoice);
    navigate('/invoices');
  }

  if (activeProjects.length === 0) {
    return (
      <div>
        <PageHeader title="New Invoice" />
        <Card className="p-8 text-center">
          <p className="text-gray-500 mb-4">You need at least one active project before creating an invoice.</p>
          <Button onClick={() => navigate('/projects')}>Go to Projects</Button>
        </Card>
      </div>
    );
  }

  function fmtCurrency(amount) {
    if (!project) return '—';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: project.currency }).format(amount);
  }

  return (
    <div>
      <PageHeader title="New Invoice" subtitle="Auto-calculates business hours for the billing month" />
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Invoice Details</h2>
          <Select label="Project" value={projectId} onChange={e => setProjectId(e.target.value)}>
            {activeProjects.map(p => (
              <option key={p.id} value={p.id}>{p.name} — {p.currency} {p.hourlyRate}/hr</option>
            ))}
          </Select>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Billing Month</label>
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={`${billingYear}-${billingMonth}`}
              onChange={handleMonthChange}
            >
              {monthOptions.map(({ year, month }) => (
                <option key={`${year}-${month}`} value={`${year}-${month}`}>
                  {MONTHS[month]} {year}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Service Description"
            value={serviceDescription}
            onChange={e => setServiceDescription(e.target.value)}
            placeholder={`Consulting services — ${MONTHS[billingMonth]} ${billingYear}`}
          />
        </Card>

        {hasTimeEntries ? (
          <Card className="p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Time Entries ({sortedEntries.length})</h2>
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 text-sm text-teal-800">
              Using <span className="font-semibold">{sortedEntries.length}</span> time {sortedEntries.length === 1 ? 'entry' : 'entries'} for this month. Each will appear as a line item on the invoice.
            </div>
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-3 py-2 font-medium text-gray-500 text-xs uppercase">Date</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-500 text-xs uppercase">Comment</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-500 text-xs uppercase">Hours</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-500 text-xs uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedEntries.map(entry => (
                    <tr key={entry.id} className="border-b border-gray-100">
                      <td className="px-3 py-2 text-gray-800">{format(new Date(entry.date + 'T00:00:00'), 'MMM d, yyyy')}</td>
                      <td className="px-3 py-2 text-gray-600">{entry.comment || <span className="text-gray-300 italic">—</span>}</td>
                      <td className="px-3 py-2 text-right text-gray-800">{parseFloat(entry.hours.toFixed(2))}</td>
                      <td className="px-3 py-2 text-right font-medium text-gray-800">{fmtCurrency(entry.hours * hourlyRate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <Card className="p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Hours Calculation</h2>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Business days in {MONTHS[billingMonth]} {billingYear}</span>
                <span className="font-medium">{businessDays} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Calculated hours (× 8)</span>
                <span className="font-medium">{calcHours} hrs</span>
              </div>
            </div>
            <Input
              label="Hours Worked (leave blank to use calculated)"
              type="number"
              min="0"
              step="0.5"
              value={hoursOverride}
              onChange={e => setHoursOverride(e.target.value)}
              placeholder={String(calcHours)}
            />
          </Card>
        )}

        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Hours</span>
              <span>{parseFloat(hoursWorked.toFixed(2))} hrs</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Rate</span>
              <span>{project?.currency} {hourlyRate}/hr</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-2 font-semibold text-base">
              <span>Total</span>
              <span className="text-orange-600">{fmtCurrency(total)}</span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Payment instructions, bank details, etc."
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            />
          </div>
          <p className="text-xs text-gray-500">Invoice #{formatInvoiceNumber(settings.nextInvoiceNumber)} will be created as a draft.</p>
        </Card>

        <div className="flex gap-3">
          <Button type="submit">Create Invoice</Button>
          <Button type="button" variant="outline" onClick={() => navigate('/invoices')}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
