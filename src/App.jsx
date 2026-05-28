import { Outlet } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { useSettings } from './hooks/useSettings';
import { useProjects } from './hooks/useProjects';
import { useInvoices } from './hooks/useInvoices';
import { useTimeEntries } from './hooks/useTimeEntries';

export function App() {
  const { settings, saveSettings, loading: lS, error: eS } = useSettings();
  const { projects, addProject, updateProject, deleteProject, loading: lP, error: eP } = useProjects();
  const { invoices, addInvoice, updateInvoice, deleteInvoice, loading: lI, error: eI } = useInvoices();
  const { timeEntries, addTimeEntry, updateTimeEntry, deleteTimeEntry, loading: lT, error: eT } = useTimeEntries();

  const loading = lS || lP || lI || lT;
  const error = eS || eP || eI || eT;

  const context = {
    settings, saveSettings,
    projects, addProject, updateProject, deleteProject,
    invoices, addInvoice, updateInvoice, deleteInvoice,
    timeEntries, addTimeEntry, updateTimeEntry, deleteTimeEntry,
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 pl-56 transition-all duration-200">
        <div className="p-8 max-w-6xl mx-auto">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              Failed to connect to API: {error}. Make sure the server is running on port 3001.
            </div>
          )}
          {loading ? (
            <div className="flex items-center justify-center h-64 text-gray-400">Loading…</div>
          ) : (
            <Outlet context={context} />
          )}
        </div>
      </main>
    </div>
  );
}
