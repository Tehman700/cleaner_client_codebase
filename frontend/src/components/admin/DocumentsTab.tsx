import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { todayKey, dayLabel, jobKey } from '../../utils/helpers';
import DayPills from '../shared/DayPills';
import Lightbox from '../Lightbox';

export default function DocumentsTab() {
  const { plots, schedule, jobs, loadJobsForDay } = useApp();
  const [day,      setDay]      = useState(todayKey());
  const [lightbox, setLightbox] = useState<{ src: string; label: string } | null>(null);

  const handleDayChange = async (d: string) => {
    setDay(d);
    const needLoad = schedule
      .filter(s => s.day === d)
      .some(s => !jobs[jobKey(d, s.plotId)]);
    if (needLoad) await loadJobsForDay(d);
  };

  const withPhotos = schedule
    .filter(s => s.day === day && jobs[jobKey(day, s.plotId)]?.photo);

  return (
    <div className="content">
      <div className="section-title">Uploaded Documents</div>
      <DayPills activeDay={day} onSelect={handleDayChange} />

      {!withPhotos.length ? (
        <div className="empty-state">
          <div className="empty-icon">📄</div>
          <div className="empty-title">No documents uploaded</div>
          <div className="empty-sub">Documents appear here once the cleaner uploads them</div>
        </div>
      ) : (
        withPhotos.map(s => {
          const plot = plots.find(p => p.id === s.plotId);
          if (!plot) return null;
          const job  = jobs[jobKey(day, s.plotId)];
          return (
            <div key={s.id} className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">{plot.name}</div>
                  <div className="card-sub">{plot.address} · {dayLabel(day)}</div>
                </div>
                <span className="badge badge-done">✓ Uploaded</span>
              </div>
              <div
                className="photo-thumb"
                style={{ width: '100%', maxWidth: 360, cursor: 'pointer' }}
                onClick={() => setLightbox({ src: job.photo!, label: `${plot.name} — signed document` })}
              >
                <img src={job.photo!} alt="Signed document" />
                <div className="photo-thumb-label">{plot.name} — tap to enlarge</div>
              </div>
            </div>
          );
        })
      )}

      {lightbox && (
        <Lightbox src={lightbox.src} label={lightbox.label} onClose={() => setLightbox(null)} />
      )}
    </div>
  );
}
