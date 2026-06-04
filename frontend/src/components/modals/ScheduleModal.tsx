import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { dayLabel } from '../../utils/helpers';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

interface Props {
  preDay?: string;
  onClose: () => void;
}

export default function ScheduleModal({ preDay, onClose }: Props) {
  const { plots, schedule, addSchedule } = useApp();
  const [day,    setDay]    = useState(preDay ?? 'Mon');
  const [plotId, setPlotId] = useState(plots[0]?.id ?? '');
  const [busy,   setBusy]   = useState(false);

  const handleSave = async () => {
    if (!plotId) return;
    if (schedule.find(s => s.day === day && s.plotId === plotId)) {
      alert(`That plot is already scheduled for ${dayLabel(day)}`);
      return;
    }
    setBusy(true);
    try {
      await addSchedule(day, plotId);
      onClose();
    } catch {
      alert('Could not add to schedule.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-overlay open">
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">Schedule a Job</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="form-group">
          <label className="form-label">Day</label>
          <select className="form-select" value={day} onChange={e => setDay(e.target.value)}>
            {DAYS.map(d => <option key={d} value={d}>{dayLabel(d)}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Plot</label>
          <select className="form-select" value={plotId} onChange={e => setPlotId(e.target.value)}>
            {plots.length
              ? plots.map(p => <option key={p.id} value={p.id}>{p.name} — {p.address}</option>)
              : <option disabled>No plots yet — add some first</option>
            }
          </select>
        </div>

        <button className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} onClick={handleSave} disabled={busy}>
          {busy ? 'Adding…' : 'Add to Schedule'}
        </button>
      </div>
    </div>
  );
}
