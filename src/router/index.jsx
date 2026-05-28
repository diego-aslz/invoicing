import { createBrowserRouter } from 'react-router-dom';
import { App } from '../App';
import { Dashboard } from '../pages/Dashboard';
import { ProjectList } from '../pages/Projects/ProjectList';
import { TimeEntryList } from '../pages/TimeEntries/TimeEntryList';
import { Settings } from '../pages/Settings';
import { InvoiceList } from '../pages/Invoices/InvoiceList';
import { InvoiceCreate } from '../pages/Invoices/InvoiceCreate';
import { InvoiceDetail } from '../pages/Invoices/InvoiceDetail';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'projects', element: <ProjectList /> },
      { path: 'time-entries', element: <TimeEntryList /> },
      { path: 'invoices', element: <InvoiceList /> },
      { path: 'invoices/new', element: <InvoiceCreate /> },
      { path: 'invoices/:id', element: <InvoiceDetail /> },
      { path: 'settings', element: <Settings /> },
    ],
  },
]);
