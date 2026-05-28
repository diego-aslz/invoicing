import { Router } from 'express';
import db from '../db/connection.js';
import { rowToObject, rowsToArray } from '../db/serialise.js';

const router = Router();

function formatInvoiceNumber(n) {
  return `INV-${String(n).padStart(4, '0')}`;
}

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM invoices ORDER BY invoice_number_raw ASC').all();
  const invoices = rowsToArray(rows);

  for (const invoice of invoices) {
    const lineItems = db.prepare('SELECT * FROM invoice_line_items WHERE invoice_id = ? ORDER BY sort_order ASC').all(invoice.id);
    invoice.lineItems = rowsToArray(lineItems);
  }

  res.json(invoices);
});

router.post('/', (req, res) => {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  const created = db.transaction(() => {
    const settings = db.prepare('SELECT next_invoice_number FROM settings WHERE id = 1').get();
    const invoiceNumberRaw = settings.next_invoice_number;
    const invoiceNumber = formatInvoiceNumber(invoiceNumberRaw);

    const {
      projectId, projectName, status = 'draft', billingMonth,
      serviceDescription = '', businessDays = 0, hoursWorked = 0,
      hourlyRate = 0, subtotal = 0, total = 0, notes = '',
      businessName = '', businessAddress = '', clientName = '', clientAddress = '',
      currency = 'USD', issuedAt = null, dueAt = null, paidAt = null,
    } = req.body;

    db.prepare(`
      INSERT INTO invoices (
        id, invoice_number, invoice_number_raw, project_id, project_name, status,
        billing_month, service_description, business_days, hours_worked, hourly_rate,
        subtotal, total, notes, business_name, business_address, client_name,
        client_address, currency, issued_at, due_at, paid_at, created_at, updated_at
      ) VALUES (
        @id, @invoiceNumber, @invoiceNumberRaw, @projectId, @projectName, @status,
        @billingMonth, @serviceDescription, @businessDays, @hoursWorked, @hourlyRate,
        @subtotal, @total, @notes, @businessName, @businessAddress, @clientName,
        @clientAddress, @currency, @issuedAt, @dueAt, @paidAt, @createdAt, @updatedAt
      )
    `).run({
      id, invoiceNumber, invoiceNumberRaw, projectId, projectName, status,
      billingMonth, serviceDescription, businessDays, hoursWorked, hourlyRate,
      subtotal, total, notes, businessName, businessAddress, clientName,
      clientAddress, currency, issuedAt, dueAt, paidAt, createdAt: now, updatedAt: now,
    });

    db.prepare('UPDATE settings SET next_invoice_number = next_invoice_number + 1, updated_at = ? WHERE id = 1')
      .run(now);

    const { lineItems } = req.body;
    if (Array.isArray(lineItems) && lineItems.length > 0) {
      const insertLine = db.prepare(`
        INSERT INTO invoice_line_items (id, invoice_id, description, hours, rate, amount, sort_order)
        VALUES (@id, @invoiceId, @description, @hours, @rate, @amount, @sortOrder)
      `);
      lineItems.forEach((item, index) => {
        insertLine.run({
          id: crypto.randomUUID(),
          invoiceId: id,
          description: item.description,
          hours: item.hours,
          rate: item.rate,
          amount: item.amount,
          sortOrder: index,
        });
      });
    }

    return db.prepare('SELECT * FROM invoices WHERE id = ?').get(id);
  })();

  const invoice = rowToObject(created);
  const createdLineItems = db.prepare('SELECT * FROM invoice_line_items WHERE invoice_id = ? ORDER BY sort_order ASC').all(id);
  invoice.lineItems = rowsToArray(createdLineItems);
  res.status(201).json(invoice);
});

router.patch('/:id', (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM invoices WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  const camelToSnake = (s) => s.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`);
  const allowed = ['status', 'notes', 'service_description', 'paid_at', 'issued_at', 'due_at',
    'invoice_number', 'hours_worked', 'business_days', 'subtotal', 'total'];

  const updates = { updated_at: new Date().toISOString() };
  for (const [k, v] of Object.entries(req.body)) {
    const snake = camelToSnake(k);
    if (allowed.includes(snake)) {
      updates[snake] = v;
    }
  }

  const setClauses = Object.keys(updates).map(k => `${k} = @${k}`).join(', ');
  db.prepare(`UPDATE invoices SET ${setClauses} WHERE id = @id`).run({ ...updates, id });

  const row = db.prepare('SELECT * FROM invoices WHERE id = ?').get(id);
  res.json(rowToObject(row));
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM invoices WHERE id = ?').run(id);
  res.status(204).end();
});

export default router;
