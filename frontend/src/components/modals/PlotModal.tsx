import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import type { Plot } from '../../types';

interface Props {
  editPlot: Plot | null;
  onClose: () => void;
}

export default function PlotModal({ editPlot, onClose }: Props) {
  const { createPlot, updatePlot } = useApp();
  const [name,    setName]    = useState('');
  const [address, setAddress] = useState('');
  const [tasks,   setTasks]   = useState(['', '', '', '']);
  const [busy,    setBusy]    = useState(false);

  useEffect(() => {
    if (editPlot) {
      setName(editPlot.name);
      setAddress(editPlot.address);
      const t = [...editPlot.tasks, '', '', '', ''].slice(0, 4);
      setTasks(t);
    } else {
      setName(''); setAddress(''); setTasks(['', '', '', '']);
    }
  }, [editPlot]);

  const handleSave = async () => {
    if (!name.trim()) { alert('Please enter a plot name.'); return; }
    const filtered = tasks.map(t => t.trim()).filter(Boolean);
    if (!filtered.length) { alert('Add at least one task.'); return; }
    setBusy(true);
    try {
      if (editPlot) {
        await updatePlot(editPlot.id, { name: name.trim(), address: address.trim(), tasks: filtered });
      } else {
        await createPlot({ name: name.trim(), address: address.trim(), tasks: filtered });
      }
      onClose();
    } catch {
      alert('Could not save plot. Check your connection.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-overlay open">
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{editPlot ? 'Edit Plot' : 'Add New Plot'}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="form-group">
          <label className="form-label">Plot Name / Number</label>
          <input className="form-input" placeholder="e.g. Plot 14, Riverside House" value={name} onChange={e => setName(e.target.value)} />
        </div>

        <div className="form-group">
          <label className="form-label">Address</label>
          <input className="form-input" placeholder="e.g. 14 High Street, Manchester" value={address} onChange={e => setAddress(e.target.value)} />
        </div>

        <div className="form-group">
          <label className="form-label">Tasks (up to 4)</label>
          {tasks.map((t, i) => (
            <div key={i} className="task-input-row">
              <span className="task-num">{i + 1}.</span>
              <input
                className="form-input"
                placeholder={i === 3 ? 'e.g. Clean doors (optional)' : `e.g. ${['Clean windows','Clean frames','Clean sills'][i] ?? 'Task'}`}
                value={t}
                onChange={e => setTasks(prev => prev.map((v, j) => j === i ? e.target.value : v))}
              />
            </div>
          ))}
        </div>

        <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleSave} disabled={busy}>
          {busy ? 'Saving…' : 'Save Plot'}
        </button>
      </div>
    </div>
  );
}
