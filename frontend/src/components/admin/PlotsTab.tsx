import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { Plot } from '../../types';
import PlotModal from '../modals/PlotModal';

export default function PlotsTab() {
  const { plots, deletePlot } = useApp();
  const [query,     setQuery]     = useState('');
  const [editPlot,  setEditPlot]  = useState<Plot | null | 'new'>('new');
  const [showModal, setShowModal] = useState(false);

  const filtered = plots.filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.address.toLowerCase().includes(query.toLowerCase())
  );

  const openNew  = () => { setEditPlot(null); setShowModal(true); };
  const openEdit = (p: Plot) => { setEditPlot(p); setShowModal(true); };
  const close    = () => setShowModal(false);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this plot? It will also be removed from the schedule.')) return;
    await deletePlot(id);
  };

  return (
    <div className="content">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div className="section-title" style={{ margin: 0 }}>All Plots</div>
        <button className="btn btn-primary btn-sm" onClick={openNew}>+ Add Plot</button>
      </div>

      <div className="search-bar">
        <span className="material-symbols-outlined search-icon">search</span>
        <input placeholder="Search plots…" value={query} onChange={e => setQuery(e.target.value)} />
      </div>

      {!filtered.length ? (
        <div className="empty-state">
          <div className="empty-icon"><span className="material-symbols-outlined" style={{ fontSize: 40 }}>home_work</span></div>
          <div className="empty-title">{plots.length ? 'No results' : 'No plots yet'}</div>
          <div className="empty-sub">{plots.length ? 'Try a different search' : 'Add your first plot to get started'}</div>
        </div>
      ) : (
        filtered.map(p => (
          <div key={p.id} className="plot-row">
            <div className="plot-row-info">
              <div className="plot-row-name">{p.name}</div>
              <div className="plot-row-sub">{p.address} · {p.tasks.filter(t => t).length} tasks</div>
            </div>
            <div className="plot-row-actions">
              <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}>Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)}>✕</button>
            </div>
          </div>
        ))
      )}

      {showModal && (
        <PlotModal editPlot={editPlot === 'new' ? null : editPlot} onClose={close} />
      )}
    </div>
  );
}
