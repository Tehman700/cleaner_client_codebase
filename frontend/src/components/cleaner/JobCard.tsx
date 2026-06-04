import { useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { jobKey } from '../../utils/helpers';
import StatusBadge from '../shared/StatusBadge';
import Lightbox from '../Lightbox';
import type { Plot, ScheduleEntry } from '../../types';

interface Props {
  day: string;
  plot: Plot;
  sched: ScheduleEntry;
}

export default function JobCard({ day, plot, sched }: Props) {
  const { jobs, toggleTask, uploadPhoto } = useApp();
  const [open,    setOpen]    = useState(true);
  const [lightbox, setLightbox] = useState<{ src: string; label: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const job       = jobs[jobKey(day, plot.id)] ?? { tasks: {}, photo: null, photoName: null };
  const tasks     = plot.tasks.filter(t => t);
  const doneCount = Object.values(job.tasks).filter(Boolean).length;
  const allDone   = doneCount === tasks.length && tasks.length > 0;
  const pct       = tasks.length ? Math.round(doneCount / tasks.length * 100) : 0;
  const status    = allDone ? 'done' : doneCount > 0 ? 'progress' : 'pending';

  const handleToggle = async (i: number) => {
    try { await toggleTask(day, plot.id, i); }
    catch { alert('Failed to save task. Check your connection.'); }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async ev => {
      const photo = ev.target?.result as string;
      try { await uploadPhoto(day, plot.id, photo, file.name); }
      catch { alert('Failed to upload photo. Check your connection.'); }
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <div className="plot-job-card">
        <div className={`plot-job-header${allDone ? ' completed' : ''}`} onClick={() => setOpen(o => !o)}>
          <div>
            <div className="card-title">{plot.name}</div>
            <div className="card-sub">{plot.address}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <StatusBadge status={status} />
            <span style={{ color: 'var(--muted)', fontSize: 18 }}>{open ? '▾' : '▸'}</span>
          </div>
        </div>

        {open && (
          <div className="plot-job-body">
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 8 }}>
              {doneCount}/{tasks.length} tasks complete
            </div>
            <div className="progress-bar" style={{ marginBottom: 14 }}>
              <div className="progress-fill" style={{ width: `${pct}%` }} />
            </div>

            {tasks.map((t, i) => {
              const checked = !!job.tasks[i];
              return (
                <div key={i} className="task-item" onClick={() => handleToggle(i)}>
                  <div className={`task-check${checked ? ' checked' : ''}`}>{checked ? '✓' : ''}</div>
                  <div className={`task-label${checked ? ' done' : ''}`}>{t}</div>
                </div>
              );
            })}

            {allDone && (
              <>
                <hr className="divider" />
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>📄 Upload Signed Document</div>
                <div
                  className={`upload-zone${job.photo ? ' has-photo' : ''}`}
                  onClick={() => fileRef.current?.click()}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                  {job.photo ? (
                    <>
                      <img
                        src={job.photo}
                        className="upload-preview"
                        alt="Uploaded document"
                        onClick={e => { e.stopPropagation(); setLightbox({ src: job.photo!, label: `${plot.name} — signed document` }); }}
                      />
                      <div style={{ marginTop: 8, fontSize: 13, color: 'var(--success)', fontWeight: 500 }}>
                        ✓ Document uploaded · tap to replace
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="upload-icon">📷</div>
                      <div className="upload-text">
                        <strong>Tap to take photo or upload</strong>
                        Photo of the site manager's signed document
                      </div>
                    </>
                  )}
                </div>
                {job.photo && <div className="completed-banner">✅ Plot fully signed off</div>}
              </>
            )}
          </div>
        )}
      </div>

      {lightbox && (
        <Lightbox src={lightbox.src} label={lightbox.label} onClose={() => setLightbox(null)} />
      )}
    </>
  );
}
