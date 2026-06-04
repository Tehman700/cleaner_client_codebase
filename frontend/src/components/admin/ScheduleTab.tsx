import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { todayKey, dayLabel, getWeekDays, jobKey, plotStatus } from '../../utils/helpers';
import StatusBadge from '../shared/StatusBadge';
import ScheduleModal from '../modals/ScheduleModal';

export default function ScheduleTab() {
  const { plots, schedule, jobs, removeSchedule } = useApp();
  const [modalDay, setModalDay] = useState<string | null>(null);
  const today = todayKey();

  const handleRemove = async (id: string) => {
    if (!confirm('Remove this job from the schedule?')) return;
    await removeSchedule(id);
  };

  return (
    <div className="content">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div className="section-title" style={{ margin: 0 }}>Week Schedule</div>
        <button className="btn btn-primary btn-sm" onClick={() => setModalDay('Mon')}>+ Add Job</button>
      </div>

      {getWeekDays().map(day => {
        const dayJobs = schedule.filter(s => s.day === day);
        return (
          <div key={day} className="day-section">
            <div className="day-header">
              {dayLabel(day)}
              {day === today && <span className="today-pill">Today</span>}
              <span className="badge badge-count">{dayJobs.length}</span>
            </div>
            {dayJobs.length === 0 ? (
              <div style={{ color: 'var(--muted)', fontSize: 14, padding: '8px 0' }}>
                No jobs —{' '}
                <a href="#" style={{ color: 'var(--primary)' }} onClick={e => { e.preventDefault(); setModalDay(day); }}>
                  add one
                </a>
              </div>
            ) : (
              dayJobs.map(s => {
                const plot   = plots.find(p => p.id === s.plotId);
                if (!plot) return null;
                const status = plotStatus(day, plot, jobs[jobKey(day, s.plotId)]);
                return (
                  <div key={s.id} className="plot-row">
                    <div className="plot-row-info">
                      <div className="plot-row-name">{plot.name}</div>
                      <div className="plot-row-sub">{plot.address} · {plot.tasks.filter(t => t).length} tasks</div>
                    </div>
                    <div className="plot-row-actions">
                      <StatusBadge status={status} />
                      <button className="btn btn-danger btn-sm" onClick={() => handleRemove(s.id)}>✕</button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        );
      })}

      {modalDay !== null && (
        <ScheduleModal preDay={modalDay} onClose={() => setModalDay(null)} />
      )}
    </div>
  );
}
