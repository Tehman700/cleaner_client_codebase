import { useState } from 'react';
import OverviewTab   from './OverviewTab';
import ScheduleTab   from './ScheduleTab';
import PlotsTab      from './PlotsTab';
import DocumentsTab  from './DocumentsTab';

type Tab = 'overview' | 'schedule' | 'plots' | 'documents';

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview',   label: '📊 Overview' },
  { id: 'schedule',   label: '📅 Schedule' },
  { id: 'plots',      label: '🏘️ Plots'    },
  { id: 'documents',  label: '📄 Documents' },
];

export default function AdminScreen({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>('overview');

  return (
    <div className="app-screen">
      <div className="topbar">
        <div className="topbar-left">
          <span className="topbar-logo">🧹</span>
          <div>
            <h1>CleanTrack</h1>
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
