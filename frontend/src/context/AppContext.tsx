import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { api } from '../api/client';
import { jobKey } from '../utils/helpers';
import { trackEvent } from '../utils/analytics';
import type { Plot, ScheduleEntry, Job } from '../types';

interface AppContextType {
  plots: Plot[];
  schedule: ScheduleEntry[];
  jobs: Record<string, Job>;
  loading: boolean;
  loadAll: (initialDay?: string) => Promise<void>;
  loadJobsForDay: (day: string) => Promise<void>;
  createPlot: (data: { name: string; address: string; tasks: string[] }) => Promise<void>;
  updatePlot: (id: string, data: { name?: string; address?: string; tasks?: string[] }) => Promise<void>;
  deletePlot: (id: string) => Promise<void>;
  addSchedule: (day: string, plotId: string) => Promise<void>;
  removeSchedule: (id: string) => Promise<void>;
  toggleTask: (day: string, plotId: string, taskIdx: number) => Promise<void>;
  uploadPhoto: (day: string, plotId: string, photo: string, photoName: string) => Promise<void>;
  reset: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

function normaliseJob(raw: { tasks: Record<string, boolean>; photo: string | null; photo_name: string | null }): Job {
  return { tasks: raw.tasks ?? {}, photo: raw.photo ?? null, photoName: raw.photo_name ?? null };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [plots,    setPlots]    = useState<Plot[]>([]);
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [jobs,     setJobs]     = useState<Record<string, Job>>({});
  const [loading,  setLoading]  = useState(false);

  const loadAll = useCallback(async (initialDay?: string) => {
    setLoading(true);
    try {
      const [rawPlots, rawSched] = await Promise.all([api.getPlots(), api.getSchedule()]);
      const normSched = rawSched.map(s => ({ id: s.id, day: s.day as ScheduleEntry['day'], plotId: s.plot_id }));
      setPlots(rawPlots);
      setSchedule(normSched);

      if (initialDay) {
        const entries = normSched.filter(s => s.day === initialDay);
        if (entries.length) {
          const results = await Promise.all(entries.map(s => api.getJob(initialDay, s.plotId)));
          setJobs(prev => {
            const next = { ...prev };
            results.forEach(r => { next[jobKey(r.day, r.plot_id)] = normaliseJob(r); });
            return next;
          });
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const loadJobsForDay = useCallback(async (day: string) => {
    setLoading(true);
    try {
      let entries: ScheduleEntry[] = [];
      setSchedule(s => { entries = s.filter(e => e.day === day); return s; });
      if (!entries.length) return;
      const results = await Promise.all(entries.map(s => api.getJob(day, s.plotId)));
      setJobs(prev => {
        const next = { ...prev };
        results.forEach(r => { next[jobKey(r.day, r.plot_id)] = normaliseJob(r); });
        return next;
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const createPlot = useCallback(async (data: { name: string; address: string; tasks: string[] }) => {
    const created = await api.createPlot(data);
    setPlots(prev => [...prev, created]);
    trackEvent('plot_created', 'admin', { plot_name: data.name });
  }, []);

  const updatePlot = useCallback(async (id: string, data: { name?: string; address?: string; tasks?: string[] }) => {
    const updated = await api.updatePlot(id, data);
    setPlots(prev => prev.map(p => p.id === id ? updated : p));
    trackEvent('plot_updated', 'admin', { plot_id: id });
  }, []);

  const deletePlot = useCallback(async (id: string) => {
    await api.deletePlot(id);
    setPlots(prev => prev.filter(p => p.id !== id));
    setSchedule(prev => prev.filter(s => s.plotId !== id));
    trackEvent('plot_deleted', 'admin', { plot_id: id });
  }, []);

  const addSchedule = useCallback(async (day: string, plotId: string) => {
    const entry = await api.addSchedule(day, plotId);
    setSchedule(prev => [...prev, { id: entry.id, day: entry.day as ScheduleEntry['day'], plotId: entry.plot_id }]);
    trackEvent('schedule_added', 'admin', { day, plot_id: plotId });
  }, []);

  const removeSchedule = useCallback(async (id: string) => {
    await api.removeSchedule(id);
    setSchedule(prev => prev.filter(s => s.id !== id));
    trackEvent('schedule_removed', 'admin', { schedule_id: id });
  }, []);

  const toggleTask = useCallback(async (day: string, plotId: string, taskIdx: number) => {
    const key      = jobKey(day, plotId);
    const current  = jobs[key] ?? { tasks: {}, photo: null, photoName: null };
    const newTasks = { ...current.tasks, [taskIdx]: !current.tasks[taskIdx] };

    setJobs(prev => ({ ...prev, [key]: { ...current, tasks: newTasks } }));
    try {
      const updated = await api.updateJob(day, plotId, { tasks: newTasks });
      setJobs(prev => ({ ...prev, [key]: normaliseJob(updated) }));
      trackEvent('task_completed', 'cleaner', { day, plot_id: plotId, task_index: taskIdx, checked: newTasks[taskIdx] });
    } catch {
      setJobs(prev => ({ ...prev, [key]: current }));
      throw new Error('Failed to save task');
    }
  }, [jobs]);

  const uploadPhoto = useCallback(async (day: string, plotId: string, photo: string, photoName: string) => {
    const key     = jobKey(day, plotId);
    const current = jobs[key] ?? { tasks: {}, photo: null, photoName: null };

    setJobs(prev => ({ ...prev, [key]: { ...current, photo, photoName } }));
    try {
      const updated = await api.updateJob(day, plotId, { photo, photo_name: photoName });
      setJobs(prev => ({ ...prev, [key]: normaliseJob(updated) }));
      trackEvent('photo_uploaded', 'cleaner', { day, plot_id: plotId });
    } catch {
      setJobs(prev => ({ ...prev, [key]: current }));
      throw new Error('Failed to upload photo');
    }
  }, [jobs]);

  const reset = useCallback(() => {
    setPlots([]); setSchedule([]); setJobs({});
  }, []);

  return (
    <AppContext.Provider value={{
      plots, schedule, jobs, loading,
      loadAll, loadJobsForDay,
      createPlot, updatePlot, deletePlot,
      addSchedule, removeSchedule,
      toggleTask, uploadPhoto,
      reset,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
