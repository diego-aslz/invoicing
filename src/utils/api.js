async function request(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export const api = {
  getSettings: () => request('/api/settings'),
  saveSettings: (updates) => request('/api/settings', { method: 'PATCH', body: updates }),

  getProjects: () => request('/api/projects'),
  addProject: (project) => request('/api/projects', { method: 'POST', body: project }),
  updateProject: (id, updates) => request(`/api/projects/${id}`, { method: 'PATCH', body: updates }),
  deleteProject: (id) => request(`/api/projects/${id}`, { method: 'DELETE' }),

  getTimeEntries: (params) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request(`/api/time-entries${qs}`);
  },
  addTimeEntry: (entry) => request('/api/time-entries', { method: 'POST', body: entry }),
  updateTimeEntry: (id, updates) => request(`/api/time-entries/${id}`, { method: 'PATCH', body: updates }),
  deleteTimeEntry: (id) => request(`/api/time-entries/${id}`, { method: 'DELETE' }),

  getInvoices: () => request('/api/invoices'),
  addInvoice: (invoice) => request('/api/invoices', { method: 'POST', body: invoice }),
  updateInvoice: (id, updates) => request(`/api/invoices/${id}`, { method: 'PATCH', body: updates }),
  deleteInvoice: (id) => request(`/api/invoices/${id}`, { method: 'DELETE' }),
};
