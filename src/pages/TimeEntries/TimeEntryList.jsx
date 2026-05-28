import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { format } from 'date-fns';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { TimeInput } from '../../components/ui/TimeInput';
import { Select } from '../../components/ui/Select';
import { EmptyState } from '../../components/ui/EmptyState';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { hoursToHHMM, hhmmToHours } from '../../utils/timeFormat';
import { useTimer } from '../../hooks/useTimer';

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

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function TimeEntryList() {
  const { projects, timeEntries, addTimeEntry, updateTimeEntry, deleteTimeEntry } = useOutletContext();
  const activeProjects = projects.filter(p => p.isActive);
  const monthOptions = getMonthOptions();

  // Filters
  const [filterProject, setFilterProject] = useState('');
  const [filterYear, setFilterYear] = useState(monthOptions[0]?.year ?? new Date().getFullYear());
  const [filterMonth, setFilterMonth] = useState(monthOptions[0]?.month ?? new Date().getMonth());

  // Timer state
  const { isRunning, currentSeconds, decimalHours, startTimer, pauseTimer, resetTimer } = useTimer();

  // Add form
  const lastUsedProject = timeEntries.length > 0
    ? [...timeEntries].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))[0].projectId
    : null;
  const [formProject, setFormProject] = useState(lastUsedProject || activeProjects[0]?.id || '');
  const [formDate, setFormDate] = useState(todayStr());
  
  // Initialize formHours with the timer's current time if it's > 0, else empty.
  // We'll also use an effect to sync it.
  const [formHours, setFormHours] = useState(decimalHours > 0 ? hoursToHHMM(decimalHours) : '');
  const [formComment, setFormComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Sync timer to formHours whenever it's running
  // We round it slightly so it doesn't flicker empty when small.
  // Actually, hoursToHHMM handles small decimals by showing 00:MM.
  // We only want to sync it if the timer is actually active (has seconds).
  useEffect(() => {
    if (currentSeconds > 0) {
      setFormHours(hoursToHHMM(decimalHours));
    }
  }, [currentSeconds, decimalHours]);

  // Edit state
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filterMonthStr = `${filterYear}-${String(filterMonth + 1).padStart(2, '0')}`;

  const filtered = timeEntries
    .filter(e => {
      if (filterProject && e.projectId !== filterProject) return false;
      if (!e.date.startsWith(filterMonthStr)) return false;
      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  const totalHours = filtered.reduce((sum, e) => sum + e.hours, 0);

  function handleFilterMonthChange(e) {
    const [y, m] = e.target.value.split('-').map(Number);
    setFilterYear(y);
    setFilterMonth(m);
  }

  async function handleAdd(e) {
    e.preventDefault();
    const decimalHours = hhmmToHours(formHours);
    if (!formProject || !formDate || !decimalHours) return;
    setSubmitting(true);
    try {
      await addTimeEntry({
        projectId: formProject,
        date: formDate,
        hours: decimalHours,
        comment: formComment,
      });
      setFormHours('');
      setFormComment('');
      resetTimer();
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(entry) {
    setEditId(entry.id);
    setEditForm({
      date: entry.date,
      hours: hoursToHHMM(entry.hours),
      comment: entry.comment,
    });
  }

  function cancelEdit() {
    setEditId(null);
    setEditForm({});
  }

  async function saveEdit(id) {
    const decimalHours = hhmmToHours(editForm.hours);
    if (!decimalHours) return;
    await updateTimeEntry(id, {
      date: editForm.date,
      hours: decimalHours,
      comment: editForm.comment,
    });
    setEditId(null);
    setEditForm({});
  }

  function getProject(projectId) {
    return projects.find(p => p.id === projectId);
  }

  return (
    <div>
      <PageHeader title="Time Entries" subtitle="Track hours worked on your projects" />

      {/* Add Entry Form */}
      <Card className="p-5 mb-6">
        <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[160px]">
            <Select label="Project" value={formProject} onChange={e => setFormProject(e.target.value)}>
              {activeProjects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
          </div>
          <div className="w-40">
            <Input label="Date" type="date" value={formDate} onChange={e => setFormDate(e.target.value)} />
          </div>
          <div className="w-44 flex flex-nowrap items-end gap-2 flex-shrink-0">
            <div className="flex-1 min-w-0">
              <TimeInput
                label="Hours"
                value={formHours}
                onChange={setFormHours}
              />
            </div>
            <Button 
              type="button" 
              variant={isRunning ? 'secondary' : 'outline'} 
              className={`flex-shrink-0 px-3 py-2 text-lg h-[38px] ${isRunning ? 'text-orange-600 bg-orange-100 border-orange-200 hover:bg-orange-200' : 'text-gray-500'}`}
              onClick={isRunning ? pauseTimer : startTimer}
              title={isRunning ? "Pause Timer" : "Start Timer"}
            >
              {isRunning ? '⏸' : '▶'}
            </Button>
          </div>
          <div className="flex-1 min-w-[200px]">
            <Input
              label="Comment"
              value={formComment}
              onChange={e => setFormComment(e.target.value)}
              placeholder="What did you work on?"
            />
          </div>
          <Button type="submit" disabled={submitting || !formProject || !formDate || !hhmmToHours(formHours)}>
            {submitting ? 'Adding…' : '+ Add Entry'}
          </Button>
        </form>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 mb-5">
        <div className="w-48">
          <Select label="Filter by Project" value={filterProject} onChange={e => setFilterProject(e.target.value)}>
            <option value="">All Projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </Select>
        </div>
        <div className="w-48">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Month</label>
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={`${filterYear}-${filterMonth}`}
              onChange={handleFilterMonthChange}
            >
              {monthOptions.map(({ year, month }) => (
                <option key={`${year}-${month}`} value={`${year}-${month}`}>
                  {MONTHS[month]} {year}
                </option>
              ))}
            </select>
          </div>
        </div>
        {filtered.length > 0 && (
          <div className="ml-auto text-sm text-gray-500">
            <span className="font-medium text-gray-700">{filtered.length}</span> {filtered.length === 1 ? 'entry' : 'entries'} · <span className="font-medium text-orange-600">{hoursToHHMM(totalHours)}</span> hours total
          </div>
        )}
      </div>

      {/* Entries Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="◷"
          title="No time entries"
          description={`No entries found for ${MONTHS[filterMonth]} ${filterYear}. Add one above!`}
        />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Project</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Hours</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Comment</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 w-32">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(entry => {
                const proj = getProject(entry.projectId);
                const isEditing = editId === entry.id;

                return (
                  <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    {isEditing ? (
                      <>
                        <td className="px-4 py-2">
                          <input
                            type="date"
                            value={editForm.date}
                            onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))}
                            className="px-2 py-1 border border-gray-300 rounded text-sm w-36 focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: proj?.color || '#888' }} />
                            <span className="text-gray-700">{proj?.name || 'Unknown'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-right">
                          <TimeInput
                            value={editForm.hours}
                            onChange={v => setEditForm(f => ({ ...f, hours: v }))}
                            className="w-20 text-right"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={editForm.comment}
                            onChange={e => setEditForm(f => ({ ...f, comment: e.target.value }))}
                            className="px-2 py-1 border border-gray-300 rounded text-sm w-full focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </td>
                        <td className="px-4 py-2 text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="sm" onClick={() => saveEdit(entry.id)}>Save</Button>
                            <Button size="sm" variant="ghost" onClick={cancelEdit}>Cancel</Button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 text-gray-800 font-medium">
                          {format(new Date(entry.date + 'T00:00:00'), 'MMM d, yyyy')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: proj?.color || '#888' }} />
                            <span className="text-gray-700">{proj?.name || 'Unknown'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-800">{hoursToHHMM(entry.hours)}</td>
                        <td className="px-4 py-3 text-gray-600">{entry.comment || <span className="text-gray-300 italic">—</span>}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="ghost" onClick={() => startEdit(entry)}>Edit</Button>
                            <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50" onClick={() => setDeleteTarget(entry)}>Delete</Button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTimeEntry(deleteTarget.id)}
        title="Delete Time Entry"
        message={`Delete the ${deleteTarget ? format(new Date(deleteTarget.date + 'T00:00:00'), 'MMM d, yyyy') : ''} entry (${deleteTarget ? hoursToHHMM(deleteTarget.hours) : ''})? This cannot be undone.`}
      />
    </div>
  );
}
