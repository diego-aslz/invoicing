import { NavLink } from 'react-router-dom';
import { useState } from 'react';

const NAV = [
  { to: '/', label: 'Dashboard', icon: '⊞', end: true },
  { to: '/projects', label: 'Projects', icon: '◈' },
  { to: '/time-entries', label: 'Time Entries', icon: '◷' },
  { to: '/invoices', label: 'Invoices', icon: '◻' },
  { to: '/settings', label: 'Settings', icon: '⚙' },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`fixed top-0 left-0 h-full bg-gray-900 text-white flex flex-col transition-all duration-200 z-40 ${collapsed ? 'w-16' : 'w-56'}`}>
      <div className="flex items-center justify-between px-4 py-5 border-b border-gray-700">
        {!collapsed && (
          <span className="font-bold text-lg text-orange-400 tracking-tight">Invoicing</span>
        )}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="text-gray-400 hover:text-white transition-colors ml-auto"
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? '›' : '‹'}
        </button>
      </div>
      <nav className="flex-1 py-4 flex flex-col gap-1 px-2">
        {NAV.map(({ to, label, icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`
            }
            title={collapsed ? label : undefined}
          >
            <span className="text-lg leading-none flex-shrink-0">{icon}</span>
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
