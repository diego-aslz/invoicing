# CLAUDE.md — Invoicing App

## Stack

- React 18 + Vite 6 + Tailwind CSS v3 + React Router v6
- date-fns for date/business-day logic
- @react-pdf/renderer for client-side PDF generation
- Express 5 + better-sqlite3 for the API server
- Node v23+ required

## Architecture

State is persisted in SQLite (`data/invoicing.db`) via an Express API on port 3001. Three custom hooks manage state; each fetches from `/api/*` on mount and exposes `{ loading, error }` alongside their data:

| Hook             | API endpoint        | Purpose                                                             |
| ---------------- | ------------------- | ------------------------------------------------------------------- |
| `useSettings`    | `/api/settings`     | Business/client info, nextInvoiceNumber, currency, paymentTermsDays |
| `useProjects`    | `/api/projects`     | Array of project objects                                            |
| `useInvoices`    | `/api/invoices`     | Array of invoice snapshots (with lineItems)                         |
| `useTimeEntries` | `/api/time-entries` | Array of time entry objects                                         |

`App.jsx` initialises all three hooks and passes everything down via React Router's `useOutletContext`. Every page reads context with `const { ... } = useOutletContext()`. While any hook is loading, App shows a spinner; on error it shows a banner.

In dev, Vite proxies `/api/*` to `http://localhost:3001` (configured in `vite.config.js`).

## Server layout

```
server/
  index.js              — Express entry, listens on port 3001
  db/
    connection.js       — opens data/invoicing.db, enables WAL, runs schema.sql
    schema.sql          — DDL: settings (singleton row), projects, invoices, time_entries, invoice_line_items
    serialise.js        — snake_case DB rows → camelCase JS objects
  routes/
    settings.js         — GET + PATCH /api/settings
    projects.js         — GET, POST, PATCH /:id, DELETE /:id
    time-entries.js     — GET (filter by projectId/month), POST, PATCH /:id, DELETE /:id
    invoices.js         — GET, POST, PATCH /:id, DELETE /:id
  middleware/
    errorHandler.js     — global 4-arg Express error handler, returns JSON
```

## Invoice number sequencing

`settings.nextInvoiceNumber` is an integer stored in the DB. On `POST /api/invoices` the server runs a transaction that reads the current value, formats it via `formatInvoiceNumber(n)` → `"INV-0042"`, inserts the invoice, then increments the counter. The frontend no longer calls `saveSettings({ nextInvoiceNumber: n + 1 })` — the server handles it atomically. The raw integer is stored as `invoiceNumberRaw` for numeric sorting.

`settings.nextInvoiceNumber` is still read in `InvoiceCreate.jsx` for the preview line ("Invoice #INV-0042 will be created as a draft"), which stays accurate as long as no concurrent creation races.

## Invoice data model — immutable snapshot

When an invoice is created, all sender/receiver fields (`businessName`, `businessAddress`, `clientName`, `clientAddress`) are copied from settings at that moment. This ensures PDFs remain correct even if settings are later changed.

## Invoice line items

When creating an invoice for a month that has time entries, each entry becomes a separate line item stored in `invoice_line_items`. The entries are snapshotted (description, hours, rate, amount) so the invoice remains immutable. If no time entries exist, the invoice uses the traditional single-line business-day calculation.

## Time entries

`time_entries` stores individual work-hour records linked to a project via `project_id`. Each entry has a `date` (YYYY-MM-DD), `hours`, and optional `comment`. The Time Entries page (`/time-entries`) provides full CRUD with project and month filtering.

## Hook patterns

**useSettings**: `useEffect` fetches on mount. `saveSettings` does an optimistic local update then reconciles with the server response.

**useProjects** / **useInvoices**: `useEffect` fetches on mount. `addProject`/`updateProject`/`deleteProject` are optimistic — they update state immediately, fire the API call, and roll back on error. `addInvoice` is **not** optimistic — it awaits the server (which assigns `invoiceNumber`/`invoiceNumberRaw`) and returns the created invoice. Callers must `await addInvoice(...)`.

## Business days calculation

`src/utils/businessDays.js` — `countBusinessDays(year, month)` filters all days in the month that are not Saturday or Sunday. `calculateBillableHours(year, month, hoursPerDay=8)` returns `{ businessDays, hours }`.

## PDF generation

`InvoicePDF.jsx` uses `@react-pdf/renderer` primitives (`Document`, `Page`, `View`, `Text`). Download is triggered in `InvoiceDetail.jsx`:

```js
const blob = await pdf(<InvoicePDF invoice={invoice} />).toBlob();
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `${invoice.invoiceNumber}.pdf`;
a.click();
URL.revokeObjectURL(url);
```

## Sidebar

`Sidebar.jsx` has local `collapsed` state that toggles between `w-56` and `w-16`. The main content area in `App.jsx` uses `pl-56` — if the sidebar collapse should affect layout dynamically, lift `collapsed` state to `App.jsx`.

## Colors

- Primary actions: `orange-500` (`#f97316`)
- Secondary/accent: `teal-600` (`#0d9488`)
- Sidebar background: `gray-900`

## Commands

```bash
npm run dev      # start API (port 3001) + Vite (port 5173) concurrently
npm run dev:api  # API server only
npm run dev:web  # Vite only
npm run build    # production build → dist/
npm run preview  # serve dist/ locally
```

## Rules

- NEVER delete the database, this project is run and used locally only

