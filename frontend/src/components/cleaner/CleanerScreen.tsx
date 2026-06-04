import { useApp } from '../../context/AppContext';
import { todayKey } from '../../utils/helpers';
import JobCard from './JobCard';

export default function CleanerScreen({ onLogout }: { onLogout: () => void }) {
  const { plots, schedule } = useApp();
  const today     = todayKey();
  const now       = new Date();
  const dateLabel = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  const scheduled = schedule.filter(s => s.day === today);

  return (
    <div className="app-screen">
      <div className="topbar">
        <div className="topbar-left">
          <span className="material-symbols-outlined topbar-menu-icon">cleaning_services</span>
          <div>
            <h1>My Jobs</h1>
            <div className="topbar-sub">{dateLabel}</div>
          </div>
        </div>
        <div className="topbar-actions">
          <button className="btn btn-outline btn-sm" onClick={onLogout}>Logout</button>
        </div>
      </div>

      <div className="content">
        {!scheduled.length ? (
          <div className="empty-state">
            <div className="empty-icon">—</div>
            <div className="empty-title">No jobs today</div>
            <div className="empty-sub">Nothing scheduled — enjoy your day</div>
          </div>
        ) : (
          scheduled.map(s => {
            const plot = plots.find(p => p.id === s.plotId);
            if (!plot) return null;
            return <JobCard key={s.id} day={today} plot={plot} sched={s} />;
          })
        )}
      </div>
    </div>
  );
}
