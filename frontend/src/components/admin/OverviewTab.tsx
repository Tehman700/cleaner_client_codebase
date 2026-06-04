import { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { todayKey, jobKey, plotStatus } from '../../utils/helpers';
import DayPills from '../shared/DayPills';
import StatusBadge from '../shared/StatusBadge';

export default function OverviewTab() {
  const { plots, schedule, jobs, loadJobsForDay } = useApp();
  const [day, setDay] = useState(todayKey());

  const handleDayChange = async (d: string) => {
    setDay(d);
    const needLoad = schedule
      .filter(s => s.day === d)
      .some(s => !jobs[jobKey(d, s.plotId)]);
    if (needLoad) await loadJobsForDay(d);
  };

  useEffect(() => {
    const needLoad = schedule
      .filter(s => s.day === day)
      .some(s => !jobs[jobKey(day, s.plotId)]);
    if (needLoad) loadJobsForDay(day);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scheduled = schedule.filter(s => s.day === day);
  const total  = scheduled.length;
  const done   = scheduled.filter(s => {
    const plot = plots.find(p => p.id === s.plotId);
    return plot && plotStatus(day, plot, jobs[jobKey(day, s.plotId)]) === 'done';
  }).length;

  return (
    <div className="content">
      <DayPills activeDay={day} onSelect={handleDayChange} />

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-num">{total}</div><div className="stat-label">Scheduled</div></div>
        <div className="stat-card"><div className="stat-num" style={{ color: 'var(--success)' }}>{done}</div><div className="stat-label">Complete</div></div>
        <div className="stat-card"><div className="stat-num" style={{ color: 'var(--warning)' }}>{total - done}</div><div className="stat-label">Remaining</div></div>
      </div>

      <div className="section-title">Today's Jobs</div>

      {!scheduled.length ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <div className="empty-title">No jobs scheduled</div>
          <div className="empty-sub">Add jobs in the Schedule tab</div>
        </div>
      ) : (
        scheduled.map(s => {
          const plot = plots.find(p => p.id === s.plotId);
          if (!plot) return null;
          const job       = jobs[jobKey(day, s.plotId)];
          const status    = plotStatus(day, plot, job);
          const taskCount = plot.tasks.filter(t => t).length;
          const doneCount = Object.values(job?.tasks ?? {}).filter(Boolean).length;
          const pct       = taskCount ? Math.round(doneCount / taskCount * 100) : 0;
          return (
            <div key={s.id} className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">{plot.name}</div>
                  <div className="card-sub">{plot.address}</div>
                </div>
                <StatusBadge status={status} />
              </div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 6 }}>
                {doneCount}/{taskCount} tasks · {pct}%
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${pct}%` }} />
              </div>
              {job?.photo && (
                <div style={{ marginTop: 12, fontSize: 13, color: 'var(--success)' }}>📄 Document uploaded</div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
