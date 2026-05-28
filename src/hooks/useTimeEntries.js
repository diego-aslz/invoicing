import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

export function useTimeEntries() {
  const [timeEntries, setTimeEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getTimeEntries()
      .then(setTimeEntries)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const addTimeEntry = useCallback(async (entry) => {
    const created = await api.addTimeEntry(entry);
    setTimeEntries(prev => [...prev, created]);
    return created;
  }, []);

  const updateTimeEntry = useCallback(async (id, updates) => {
    setTimeEntries(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    try {
      const updated = await api.updateTimeEntry(id, updates);
      setTimeEntries(prev => prev.map(e => e.id === id ? updated : e));
    } catch (err) {
      setError(err.message);
      api.getTimeEntries().then(setTimeEntries).catch(() => {});
    }
  }, []);

  const deleteTimeEntry = useCallback(async (id) => {
    setTimeEntries(prev => prev.filter(e => e.id !== id));
    try {
      await api.deleteTimeEntry(id);
    } catch (err) {
      setError(err.message);
      api.getTimeEntries().then(setTimeEntries).catch(() => {});
    }
  }, []);

  return { timeEntries, addTimeEntry, updateTimeEntry, deleteTimeEntry, loading, error };
}
