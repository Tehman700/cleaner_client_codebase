import { useState } from 'react';
import OverviewTab  from './OverviewTab';
import ScheduleTab  from './ScheduleTab';
import PlotsTab     from './PlotsTab';
import DocumentsTab from './DocumentsTab';

type Tab = 'overview' | 'schedule' | 'plots' | 'documents';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'overview',  label: 'Overview',  icon: 'grid_view' },
  { id: 'schedule',  label: 'Schedule',  icon: 'calendar_month' },
  { id: 'plots',     label: 'Plots',     icon: 'home_work' },
  { id: 'documents', label: 'Documents', icon: 'description' },
];

export default function AdminScreen({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>('overview');

  return (
    <div className="app-screen">
      <div className="topbar">
        <div className="topbar-left">
          <span className="topbar-logo">🧹</span>
          <div>
            <h1>CleanTracking</h1>
            <div className="topbar-sub">Admin Dashboard</div>
          </div>
        </div>
        <div className="topbar-actions">
          <button className="btn btn-outline btn-sm" onClick={onLogout}>Logout</button>
        </div>
      </div>

      <div className="tab-bar">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`tab-btn${tab === t.id ? ' active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <span className="material-symbols-outlined">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview'  && <OverviewTab />}
      {tab === 'schedule'  && <ScheduleTab />}
      {tab === 'plots'     && <PlotsTab />}
      {tab === 'documents' && <DocumentsTab />}
    </div>
  );
}
